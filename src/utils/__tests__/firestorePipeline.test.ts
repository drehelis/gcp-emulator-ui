import { describe, it, expect } from 'vitest'
import {
  PIPELINE_WINDOW_FUNCTIONS,
  buildStructuredPipeline,
  extractPipelineDocuments,
  getWindowFunctionFieldMode,
  hasPipelineOnlyStages,
  parsePipelineExpression,
  parseQueryLiteral,
  type PipelineStageConfig,
} from '../firestorePipeline'

describe('firestorePipeline utilities', () => {
  describe('PIPELINE_WINDOW_FUNCTIONS & getWindowFunctionFieldMode', () => {
    it('exposes all 10 emulator v1.23.0 window functions', () => {
      const names = PIPELINE_WINDOW_FUNCTIONS.map(w => w.value)
      expect(names).toEqual([
        'sum',
        'average',
        'count',
        'minimum',
        'maximum',
        'first',
        'last',
        'array_agg',
        'array_agg_distinct',
        'rank',
      ])
    })

    it('returns accurate field modes', () => {
      expect(getWindowFunctionFieldMode('rank')).toBe('none')
      expect(getWindowFunctionFieldMode('count')).toBe('optional')
      expect(getWindowFunctionFieldMode('sum')).toBe('required')
      expect(getWindowFunctionFieldMode('array_agg_distinct')).toBe('required')
      expect(getWindowFunctionFieldMode(undefined)).toBe('required')
    })
  })

  describe('hasPipelineOnlyStages', () => {
    it('returns false for empty or legacy aggregation stages', () => {
      expect(hasPipelineOnlyStages([])).toBe(false)
      expect(hasPipelineOnlyStages([{ type: 'count', alias: 'c' }])).toBe(false)
      expect(
        hasPipelineOnlyStages([
          { type: 'sum', alias: 's', field: 'amount' },
          { type: 'avg', alias: 'a', field: 'amount' },
        ])
      ).toBe(false)
    })

    it('returns true when add_fields, let, or add_window_fields is present', () => {
      expect(hasPipelineOnlyStages([{ type: 'add_fields', alias: 'x', field: '$a' }])).toBe(true)
      expect(hasPipelineOnlyStages([{ type: 'let', alias: 'v', field: '10' }])).toBe(true)
      expect(
        hasPipelineOnlyStages([
          { type: 'count', alias: 'c' },
          { type: 'add_window_fields', alias: 'r', windowFunction: 'rank' },
        ])
      ).toBe(true)
    })
  })

  describe('parseQueryLiteral', () => {
    it('parses booleans, null, numbers, and strings', () => {
      expect(parseQueryLiteral('true')).toEqual({ booleanValue: true })
      expect(parseQueryLiteral('FALSE')).toEqual({ booleanValue: false })
      expect(parseQueryLiteral('null')).toEqual({ nullValue: null })
      expect(parseQueryLiteral('42')).toEqual({ integerValue: '42' })
      expect(parseQueryLiteral('3.14')).toEqual({ doubleValue: 3.14 })
      expect(parseQueryLiteral('"hello"')).toEqual({ stringValue: 'hello' })
      expect(parseQueryLiteral("'world'")).toEqual({ stringValue: 'world' })
      expect(parseQueryLiteral('plain')).toEqual({ stringValue: 'plain' })
      expect(parseQueryLiteral('')).toEqual({ stringValue: '' })
    })
  })

  describe('parsePipelineExpression', () => {
    it('parses empty input as nullValue', () => {
      expect(parsePipelineExpression('   ')).toEqual({ nullValue: null })
    })

    it('parses field references via $ and field()', () => {
      expect(parsePipelineExpression('$price')).toEqual({ fieldReferenceValue: 'price' })
      expect(parsePipelineExpression('field(user.age)')).toEqual({
        fieldReferenceValue: 'user.age',
      })
      expect(parsePipelineExpression('field("user.name")')).toEqual({
        fieldReferenceValue: 'user.name',
      })
    })

    it('parses variable references via @', () => {
      expect(parsePipelineExpression('@taxRate')).toEqual({
        variableReferenceValue: 'taxRate',
      })
    })

    it('parses nested function calls and quoted commas', () => {
      expect(parsePipelineExpression('concat($first, ", ", to_upper($last))')).toEqual({
        functionValue: {
          name: 'concat',
          args: [
            { fieldReferenceValue: 'first' },
            { stringValue: ', ' },
            {
              functionValue: {
                name: 'to_upper',
                args: [{ fieldReferenceValue: 'last' }],
              },
            },
          ],
        },
      })
    })

    it('parses zero-arg functions and literals', () => {
      expect(parsePipelineExpression('rank()')).toEqual({
        functionValue: { name: 'rank', args: [] },
      })
      expect(parsePipelineExpression('100')).toEqual({ integerValue: '100' })
    })
  })

  describe('buildStructuredPipeline', () => {
    it('builds collection source, single where, sort, add_fields, let, and limit stages', () => {
      const stages: PipelineStageConfig[] = [
        { type: 'let', alias: 'discount', field: '0.1' },
        { type: 'add_fields', alias: 'finalPrice', field: 'multiply($price, @discount)' },
      ]

      const result = buildStructuredPipeline({
        collection: 'orders',
        whereClauses: [{ field: 'status', op: 'EQUAL', value: 'paid' }],
        orderByClauses: [{ field: 'createdAt', direction: 'DESCENDING' }],
        limit: 25,
        stages,
      })

      expect(result.pipeline.stages).toEqual([
        { name: 'collection', args: [{ referenceValue: '/orders' }] },
        {
          name: 'where',
          args: [
            {
              functionValue: {
                name: 'equal',
                args: [{ fieldReferenceValue: 'status' }, { stringValue: 'paid' }],
              },
            },
          ],
        },
        {
          name: 'sort',
          args: [
            {
              mapValue: {
                fields: {
                  expression: { fieldReferenceValue: 'createdAt' },
                  direction: { stringValue: 'descending' },
                },
              },
            },
          ],
        },
        {
          name: 'let',
          args: [{ mapValue: { fields: { discount: { doubleValue: 0.1 } } } }],
        },
        {
          name: 'add_fields',
          args: [
            {
              mapValue: {
                fields: {
                  finalPrice: {
                    functionValue: {
                      name: 'multiply',
                      args: [
                        { fieldReferenceValue: 'price' },
                        { variableReferenceValue: 'discount' },
                      ],
                    },
                  },
                },
              },
            },
          ],
        },
        { name: 'limit', args: [{ integerValue: '25' }] },
      ])
    })

    it('builds collection_group and composite AND where with IN / NOT_IN operators', () => {
      const result = buildStructuredPipeline({
        collection: '/items',
        allDescendants: true,
        whereClauses: [
          { field: 'category', op: 'IN', value: 'books, music' },
          { field: 'price', op: 'GREATER_THAN', value: '10' },
          { field: 'ignored', op: 'UNKNOWN_OP', value: 'x' },
        ],
        orderByClauses: [{ field: 'price', direction: 'ASCENDING' }],
        stages: [{ type: 'add_fields', alias: 'ok', field: 'true' }],
      })

      expect(result.pipeline.stages[0]).toEqual({
        name: 'collection_group',
        args: [{ stringValue: '/items' }],
      })
      expect(result.pipeline.stages[1]).toEqual({
        name: 'where',
        args: [
          {
            functionValue: {
              name: 'and',
              args: [
                {
                  functionValue: {
                    name: 'equal_any',
                    args: [
                      { fieldReferenceValue: 'category' },
                      {
                        arrayValue: {
                          values: [{ stringValue: 'books' }, { stringValue: 'music' }],
                        },
                      },
                    ],
                  },
                },
                {
                  functionValue: {
                    name: 'greater_than',
                    args: [{ fieldReferenceValue: 'price' }, { integerValue: '10' }],
                  },
                },
                {
                  functionValue: {
                    name: 'equal',
                    args: [{ fieldReferenceValue: 'ignored' }, { stringValue: 'x' }],
                  },
                },
              ],
            },
          },
        ],
      })
      expect(result.pipeline.stages[2]).toEqual({
        name: 'sort',
        args: [
          {
            mapValue: {
              fields: {
                expression: { fieldReferenceValue: 'price' },
                direction: { stringValue: 'ascending' },
              },
            },
          },
        ],
      })
    })

    it('preserves leading slash on collection path', () => {
      const result = buildStructuredPipeline({
        collection: '/users',
        stages: [],
      })
      expect(result.pipeline.stages[0]).toEqual({
        name: 'collection',
        args: [{ referenceValue: '/users' }],
      })
    })

    it('builds add_window_fields stage with partition_by, sort, and window functions', () => {
      const result = buildStructuredPipeline({
        collection: 'sales',
        stages: [
          {
            type: 'add_window_fields',
            alias: 'runningTotal',
            windowFunction: 'sum',
            field: 'amount',
            partitionBy: 'region, category',
            orderByField: 'timestamp',
            orderByDirection: 'ASCENDING',
          },
          {
            type: 'add_window_fields',
            alias: 'salesRank',
            windowFunction: 'rank',
            field: 'ignoredField',
            partitionBy: 'region',
            orderByField: 'amount',
            orderByDirection: 'DESCENDING',
          },
          {
            type: 'add_window_fields',
            alias: 'distinctTags',
            windowFunction: 'array_agg_distinct',
            field: 'tag',
          },
          {
            type: 'add_window_fields',
            alias: '   ',
            windowFunction: 'count',
          },
        ],
      })

      expect(result.pipeline.stages).toEqual([
        { name: 'collection', args: [{ referenceValue: '/sales' }] },
        {
          name: 'add_window_fields',
          args: [
            {
              mapValue: {
                fields: {
                  runningTotal: {
                    functionValue: {
                      name: 'sum',
                      args: [{ fieldReferenceValue: 'amount' }],
                    },
                  },
                },
              },
            },
          ],
          options: {
            partition_by: {
              arrayValue: {
                values: [{ fieldReferenceValue: 'region' }, { fieldReferenceValue: 'category' }],
              },
            },
            sort: {
              arrayValue: {
                values: [
                  {
                    mapValue: {
                      fields: {
                        expression: { fieldReferenceValue: 'timestamp' },
                        direction: { stringValue: 'ascending' },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        {
          name: 'add_window_fields',
          args: [
            {
              mapValue: {
                fields: {
                  salesRank: {
                    functionValue: {
                      name: 'rank',
                      args: [],
                    },
                  },
                },
              },
            },
          ],
          options: {
            partition_by: {
              arrayValue: {
                values: [{ fieldReferenceValue: 'region' }],
              },
            },
            sort: {
              arrayValue: {
                values: [
                  {
                    mapValue: {
                      fields: {
                        expression: { fieldReferenceValue: 'amount' },
                        direction: { stringValue: 'descending' },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        {
          name: 'add_window_fields',
          args: [
            {
              mapValue: {
                fields: {
                  distinctTags: {
                    functionValue: {
                      name: 'array_agg_distinct',
                      args: [{ fieldReferenceValue: 'tag' }],
                    },
                  },
                },
              },
            },
          ],
        },
      ])
    })

    it('maps count, sum, and avg stages to aggregate stages inside pipelines', () => {
      const result = buildStructuredPipeline({
        collection: 'orders',
        stages: [
          { type: 'add_fields', alias: 'tax', field: '1' },
          { type: 'count', alias: 'totalCount' },
          { type: 'sum', alias: 'totalAmount', field: 'amount' },
          { type: 'avg', alias: 'avgAmount', field: 'amount' },
        ],
      })

      expect(result.pipeline.stages.slice(2)).toEqual([
        {
          name: 'aggregate',
          args: [
            {
              mapValue: {
                fields: {
                  totalCount: { functionValue: { name: 'count', args: [] } },
                },
              },
            },
          ],
        },
        {
          name: 'aggregate',
          args: [
            {
              mapValue: {
                fields: {
                  totalAmount: {
                    functionValue: {
                      name: 'sum',
                      args: [{ fieldReferenceValue: 'amount' }],
                    },
                  },
                },
              },
            },
          ],
        },
        {
          name: 'aggregate',
          args: [
            {
              mapValue: {
                fields: {
                  avgAmount: {
                    functionValue: {
                      name: 'average',
                      args: [{ fieldReferenceValue: 'amount' }],
                    },
                  },
                },
              },
            },
          ],
        },
      ])
    })
  })

  describe('extractPipelineDocuments', () => {
    it('flattens documents across response chunks and fills missing names/fields', () => {
      const docs = extractPipelineDocuments([
        {
          results: [
            {
              name: 'projects/p/databases/(default)/documents/orders/o1',
              fields: { total: { integerValue: '10' } },
            },
            { name: '', fields: undefined as any },
          ],
        },
        { executionTime: '2026-11-27T00:00:00Z' },
        {
          results: [
            { name: 'projects/p/databases/(default)/documents/orders/o2', fields: {} },
            null as any,
          ],
        },
      ])

      expect(docs).toHaveLength(3)
      expect(docs[0]!.name).toContain('o1')
      expect(docs[1]!.name).toBe('result_2')
      expect(docs[1]!.fields).toEqual({})
      expect(docs[2]!.name).toContain('o2')
    })
  })
})
