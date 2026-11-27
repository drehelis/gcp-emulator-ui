/**
 * Utilities for building and executing Firestore Pipelines API requests
 * Supports standard stages (collection, where, sort, limit, add_fields, let, aggregate)
 * and window function stages (add_window_fields).
 */

import type {
  ExecutePipelineResponse,
  FirestoreDocument,
  FirestorePipelineStage,
  FirestorePipelineWindowFunction,
  FirestoreStructuredPipeline,
  FirestoreValue,
} from '@/types'

export interface WindowFunctionInfo {
  value: FirestorePipelineWindowFunction
  label: string
  fieldMode: 'required' | 'optional' | 'none'
}

export const PIPELINE_WINDOW_FUNCTIONS: WindowFunctionInfo[] = [
  { value: 'sum', label: 'sum', fieldMode: 'required' },
  { value: 'average', label: 'average', fieldMode: 'required' },
  { value: 'count', label: 'count', fieldMode: 'optional' },
  { value: 'minimum', label: 'minimum', fieldMode: 'required' },
  { value: 'maximum', label: 'maximum', fieldMode: 'required' },
  { value: 'first', label: 'first', fieldMode: 'required' },
  { value: 'last', label: 'last', fieldMode: 'required' },
  { value: 'array_agg', label: 'array_agg', fieldMode: 'required' },
  { value: 'array_agg_distinct', label: 'array_agg_distinct', fieldMode: 'required' },
  { value: 'rank', label: 'rank', fieldMode: 'none' },
]

export type PipelineStageType = 'count' | 'sum' | 'avg' | 'add_fields' | 'let' | 'add_window_fields'

export interface PipelineStageConfig {
  type: PipelineStageType
  alias: string
  field?: string
  windowFunction?: FirestorePipelineWindowFunction
  partitionBy?: string
  orderByField?: string
  orderByDirection?: 'ASCENDING' | 'DESCENDING'
}

export interface PipelineWhereClause {
  field: string
  op: string
  value: string
}

export interface PipelineOrderByClause {
  field: string
  direction: 'ASCENDING' | 'DESCENDING'
}

export interface BuildPipelineParams {
  collection: string
  allDescendants?: boolean
  whereClauses?: PipelineWhereClause[]
  orderByClauses?: PipelineOrderByClause[]
  limit?: number
  stages: PipelineStageConfig[]
}

const PIPELINE_ONLY_STAGE_TYPES: ReadonlySet<PipelineStageType> = new Set([
  'add_fields',
  'let',
  'add_window_fields',
])

const WHERE_OPERATOR_MAP: Record<string, string> = {
  EQUAL: 'equal',
  NOT_EQUAL: 'not_equal',
  LESS_THAN: 'less_than',
  LESS_THAN_OR_EQUAL: 'less_than_or_equal',
  GREATER_THAN: 'greater_than',
  GREATER_THAN_OR_EQUAL: 'greater_than_or_equal',
  ARRAY_CONTAINS: 'array_contains',
  IN: 'equal_any',
  NOT_IN: 'not_equal_any',
}

/**
 * Returns whether a window function accepts or requires a field argument.
 */
export function getWindowFunctionFieldMode(
  fn?: FirestorePipelineWindowFunction
): WindowFunctionInfo['fieldMode'] {
  const info = PIPELINE_WINDOW_FUNCTIONS.find(item => item.value === fn)
  return info?.fieldMode ?? 'required'
}

/**
 * Returns true if any configured stage requires the Firestore Pipelines API (:executePipeline)
 * rather than the legacy :runAggregationQuery endpoint.
 */
export function hasPipelineOnlyStages(stages: PipelineStageConfig[]): boolean {
  return stages.some(stage => PIPELINE_ONLY_STAGE_TYPES.has(stage.type))
}

/**
 * Parses a literal input string into a FirestoreValue.
 */
export function parseQueryLiteral(val: string): FirestoreValue {
  const trimmed = val.trim()
  if (trimmed.toLowerCase() === 'true') return { booleanValue: true }
  if (trimmed.toLowerCase() === 'false') return { booleanValue: false }
  if (trimmed.toLowerCase() === 'null') return { nullValue: null }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)
  ) {
    return { stringValue: trimmed.slice(1, -1) }
  }

  if (trimmed !== '' && !Number.isNaN(Number(trimmed))) {
    if (trimmed.includes('.')) return { doubleValue: parseFloat(trimmed) }
    return { integerValue: trimmed }
  }

  return { stringValue: val }
}

/**
 * Splits function arguments at top-level commas while respecting quotes and nested parentheses.
 */
function splitExpressionArgs(input: string): string[] {
  const args: string[] = []
  let current = ''
  let depth = 0
  let quote: '"' | "'" | null = null

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!

    if (quote) {
      current += ch
      if (ch === quote && input[i - 1] !== '\\') {
        quote = null
      }
      continue
    }

    if (ch === '"' || ch === "'") {
      quote = ch
      current += ch
      continue
    }

    if (ch === '(') {
      depth++
      current += ch
      continue
    }

    if (ch === ')') {
      depth = Math.max(0, depth - 1)
      current += ch
      continue
    }

    if (ch === ',' && depth === 0) {
      args.push(current.trim())
      current = ''
      continue
    }

    current += ch
  }

  if (current.trim() !== '') {
    args.push(current.trim())
  }

  return args
}

/**
 * Parses a pipeline expression into a FirestoreValue expression node.
 * Supports:
 * - Field references: `$price` or `field(price)`
 * - Variable references: `@discount`
 * - Function calls: `multiply($price, 0.9)`, `concat($first, " ", $last)`
 * - Literals: numbers, booleans, null, quoted/unquoted strings
 */
export function parsePipelineExpression(expr: string): FirestoreValue {
  const trimmed = expr.trim()
  if (!trimmed) {
    return { nullValue: null }
  }

  if (trimmed.startsWith('$') && trimmed.length > 1) {
    return { fieldReferenceValue: trimmed.slice(1) }
  }

  if (trimmed.startsWith('@') && trimmed.length > 1) {
    return { variableReferenceValue: trimmed.slice(1) }
  }

  const fnMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/)
  if (fnMatch) {
    const fnName = fnMatch[1]!
    const rawArgs = fnMatch[2]!.trim()

    if (fnName === 'field' && rawArgs) {
      const unquoted = rawArgs.replace(/^["']|["']$/g, '')
      return { fieldReferenceValue: unquoted }
    }

    const parsedArgs = rawArgs ? splitExpressionArgs(rawArgs).map(parsePipelineExpression) : []
    return {
      functionValue: {
        name: fnName,
        args: parsedArgs,
      },
    }
  }

  return parseQueryLiteral(trimmed)
}

function buildWhereExpression(clause: PipelineWhereClause): FirestoreValue {
  const opName = WHERE_OPERATOR_MAP[clause.op] || 'equal'
  const fieldRef: FirestoreValue = { fieldReferenceValue: clause.field.trim() }

  if (opName === 'equal_any' || opName === 'not_equal_any') {
    const values = clause.value
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .map(parseQueryLiteral)

    return {
      functionValue: {
        name: opName,
        args: [fieldRef, { arrayValue: { values } }],
      },
    }
  }

  return {
    functionValue: {
      name: opName,
      args: [fieldRef, parseQueryLiteral(clause.value)],
    },
  }
}

function buildWindowStage(stage: PipelineStageConfig): FirestorePipelineStage | null {
  const alias = stage.alias.trim()
  if (!alias) return null

  const fnName: FirestorePipelineWindowFunction = stage.windowFunction || 'sum'
  const fieldMode = getWindowFunctionFieldMode(fnName)
  const fieldPath = stage.field?.trim() || ''

  const fnArgs: FirestoreValue[] =
    fieldMode !== 'none' && fieldPath ? [{ fieldReferenceValue: fieldPath }] : []

  const options: Record<string, FirestoreValue> = {}

  const partitionFields = (stage.partitionBy || '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)

  if (partitionFields.length > 0) {
    options.partition_by = {
      arrayValue: {
        values: partitionFields.map(path => ({ fieldReferenceValue: path })),
      },
    }
  }

  if (stage.orderByField?.trim()) {
    const direction = stage.orderByDirection === 'DESCENDING' ? 'descending' : 'ascending'
    options.sort = {
      arrayValue: {
        values: [
          {
            mapValue: {
              fields: {
                expression: { fieldReferenceValue: stage.orderByField.trim() },
                direction: { stringValue: direction },
              },
            },
          },
        ],
      },
    }
  }

  const pipelineStage: FirestorePipelineStage = {
    name: 'add_window_fields',
    args: [
      {
        mapValue: {
          fields: {
            [alias]: {
              functionValue: {
                name: fnName,
                args: fnArgs,
              },
            },
          },
        },
      },
    ],
  }

  if (Object.keys(options).length > 0) {
    pipelineStage.options = options
  }

  return pipelineStage
}

/**
 * Builds a Firestore StructuredPipeline payload from Query Builder state.
 */
export function buildStructuredPipeline(params: BuildPipelineParams): FirestoreStructuredPipeline {
  const stages: FirestorePipelineStage[] = []

  // Source stage
  if (params.allDescendants) {
    stages.push({
      name: 'collection_group',
      args: [{ stringValue: params.collection }],
    })
  } else {
    const collectionPath = params.collection.startsWith('/')
      ? params.collection
      : `/${params.collection}`
    stages.push({
      name: 'collection',
      args: [{ referenceValue: collectionPath }],
    })
  }

  // Where stage
  const validWhere = (params.whereClauses || []).filter(w => w.field.trim() !== '')
  if (validWhere.length === 1) {
    stages.push({
      name: 'where',
      args: [buildWhereExpression(validWhere[0]!)],
    })
  } else if (validWhere.length > 1) {
    stages.push({
      name: 'where',
      args: [
        {
          functionValue: {
            name: 'and',
            args: validWhere.map(buildWhereExpression),
          },
        },
      ],
    })
  }

  // Sort stage
  const validOrderBy = (params.orderByClauses || []).filter(o => o.field.trim() !== '')
  if (validOrderBy.length > 0) {
    stages.push({
      name: 'sort',
      args: validOrderBy.map(o => ({
        mapValue: {
          fields: {
            expression: { fieldReferenceValue: o.field.trim() },
            direction: {
              stringValue: o.direction === 'DESCENDING' ? 'descending' : 'ascending',
            },
          },
        },
      })),
    })
  }

  // Pipeline transformation / window / aggregation stages
  for (const stage of params.stages) {
    const alias = stage.alias.trim()
    if (!alias) continue

    if (stage.type === 'add_fields' || stage.type === 'let') {
      stages.push({
        name: stage.type,
        args: [
          {
            mapValue: {
              fields: {
                [alias]: parsePipelineExpression(stage.field || ''),
              },
            },
          },
        ],
      })
    } else if (stage.type === 'add_window_fields') {
      const windowStage = buildWindowStage(stage)
      if (windowStage) {
        stages.push(windowStage)
      }
    } else if (stage.type === 'count' || stage.type === 'sum' || stage.type === 'avg') {
      const fnName = stage.type === 'avg' ? 'average' : stage.type
      const fieldPath = stage.field?.trim() || ''
      const fnArgs: FirestoreValue[] =
        stage.type !== 'count' && fieldPath ? [{ fieldReferenceValue: fieldPath }] : []

      stages.push({
        name: 'aggregate',
        args: [
          {
            mapValue: {
              fields: {
                [alias]: {
                  functionValue: {
                    name: fnName,
                    args: fnArgs,
                  },
                },
              },
            },
          },
        ],
      })
    }
  }

  // Limit stage
  if (params.limit && params.limit > 0) {
    stages.push({
      name: 'limit',
      args: [{ integerValue: String(params.limit) }],
    })
  }

  return {
    pipeline: { stages },
  }
}

/**
 * Extracts flattened FirestoreDocument list from streaming ExecutePipelineResponse chunks.
 */
export function extractPipelineDocuments(
  responses: ExecutePipelineResponse[]
): FirestoreDocument[] {
  const docs: FirestoreDocument[] = []

  for (const chunk of responses) {
    if (!chunk?.results || !Array.isArray(chunk.results)) continue
    for (const item of chunk.results) {
      if (!item) continue
      docs.push({
        ...item,
        name: item.name || `result_${docs.length + 1}`,
        fields: item.fields || {},
      })
    }
  }

  return docs
}
