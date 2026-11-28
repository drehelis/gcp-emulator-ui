import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import QueryView from '../QueryView.vue'
import firestoreApi from '@/api/firestore'
import { useFirestoreStore } from '@/stores/firestore'

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { projectId: 'test-project' },
  }),
}))

vi.mock('@/api/firestore', () => ({
  default: {
    runQuery: vi.fn(),
    runAggregationQuery: vi.fn(),
    executePipeline: vi.fn(),
    listCollections: vi.fn().mockResolvedValue({ collections: [] }),
    getDatabasePath: (projectId: string, databaseId: string) =>
      `projects/${projectId}/databases/${databaseId}`,
    getDefaultDatabasePath: (projectId: string) => `projects/${projectId}/databases/(default)`,
  },
}))

describe('QueryView.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    const store = useFirestoreStore()
    store.collections = [
      {
        id: 'orders',
        name: 'orders',
        path: 'projects/test-project/databases/(default)/documents/orders',
      } as any,
    ]
  })

  const mountView = () =>
    mount(QueryView, {
      global: {
        mocks: {
          $route: {
            params: { projectId: 'test-project' },
          },
        },
        stubs: {
          RouterLink: { template: '<a><slot /></a>' },
          CustomSelect: {
            props: ['modelValue', 'options'],
            emits: ['update:modelValue'],
            template:
              '<select data-test="collection-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option value="">Select</option><option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option></select>',
          },
        },
      },
    })

  it('executes add_window_fields stage via executePipeline and renders results + Enterprise values', async () => {
    vi.mocked(firestoreApi.executePipeline).mockResolvedValue([
      {
        results: [
          {
            name: 'projects/test-project/databases/(default)/documents/orders/o1',
            fields: {
              region: { stringValue: 'us' },
              amount: { decimal128Value: '199.95' },
              embedding: {
                mapValue: {
                  fields: {
                    __type__: { stringValue: '__vector__' },
                    value: { arrayValue: { values: [{ doubleValue: 0.1 }, { doubleValue: 0.2 }] } },
                  },
                },
              },
              runningTotal: { doubleValue: 199.95 },
            },
          },
        ],
      },
    ])

    const wrapper = mountView()
    await wrapper.find('[data-test="collection-select"]').setValue('orders')

    // Add a pipeline stage and switch to add_window_fields
    const addStageBtn = wrapper.findAll('button').find(b => b.text().includes('+ STAGE'))!
    await addStageBtn.trigger('click')

    const stageSelects = wrapper.findAll('select')
    const stageTypeSelect = stageSelects.find(s =>
      s.findAll('option').some(o => o.element.value === 'add_window_fields')
    )!
    await stageTypeSelect.setValue('add_window_fields')

    // Set window function to array_agg_distinct
    const wfSelect = wrapper.find('select[aria-label="Window function"]')
    await wfSelect.setValue('array_agg_distinct')

    // Run query
    const runBtn = wrapper.findAll('button').find(b => b.text().includes('Run Query'))!
    await runBtn.trigger('click')
    await flushPromises()

    expect(firestoreApi.executePipeline).toHaveBeenCalledTimes(1)
    expect(firestoreApi.runQuery).not.toHaveBeenCalled()
    expect(firestoreApi.runAggregationQuery).not.toHaveBeenCalled()

    const payload = vi.mocked(firestoreApi.executePipeline).mock.calls[0]![1]
    const windowStage = payload.structuredPipeline.pipeline.stages.find(
      s => s.name === 'add_window_fields'
    )
    expect(windowStage).toBeDefined()
    expect(wrapper.text()).toContain('Pipeline API')
    expect(wrapper.text()).toContain('199.95')
    expect(wrapper.text()).toContain('[0.1, 0.2]')
  })

  it('executes standard aggregation stages via runAggregationQuery', async () => {
    vi.mocked(firestoreApi.runAggregationQuery).mockResolvedValue({
      result: {
        aggregateFields: {
          stage_1: { integerValue: '7' },
        },
      },
    })

    const wrapper = mountView()
    await wrapper.find('[data-test="collection-select"]').setValue('orders')

    const addStageBtn = wrapper.findAll('button').find(b => b.text().includes('+ STAGE'))!
    await addStageBtn.trigger('click')

    const runBtn = wrapper.findAll('button').find(b => b.text().includes('Run Query'))!
    await runBtn.trigger('click')
    await flushPromises()

    expect(firestoreApi.runAggregationQuery).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('stage_1: 7')
  })

  it('displays and dismisses API error messages in the UI', async () => {
    vi.mocked(firestoreApi.runQuery).mockRejectedValue({
      response: {
        status: 400,
        data: {
          error: {
            status: 'FAILED_PRECONDITION',
            message: 'The query requires a composite index.',
          },
        },
      },
    })

    const wrapper = mountView()
    await wrapper.find('[data-test="collection-select"]').setValue('orders')

    const runBtn = wrapper.findAll('button').find(b => b.text().includes('Run Query'))!
    await runBtn.trigger('click')
    await flushPromises()

    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('FAILED_PRECONDITION: The query requires a composite index.')

    await wrapper.find('button[aria-label="Dismiss error"]').trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })
})
