import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FieldItem from '../FieldItem.vue'

vi.mock('@heroicons/vue/24/outline', () => ({
  ChevronRightIcon: { template: '<svg></svg>' },
  PlusIcon: { template: '<svg></svg>' },
  PencilIcon: { template: '<svg></svg>' },
  TrashIcon: { template: '<svg></svg>' },
}))

// A document field shaped like the Firestore REST payload: an array of maps.
const messagesField = {
  arrayValue: {
    values: [
      { mapValue: { fields: { role: { stringValue: 'user' } } } },
      { mapValue: { fields: { role: { stringValue: 'assistant' } } } },
    ],
  },
}

const mountField = (expandedFields: Set<string>) =>
  mount(FieldItem, {
    props: {
      fieldName: 'messages',
      fieldValue: messagesField,
      fieldPath: 'messages',
      expandedFields,
    },
  })

describe('FieldItem', () => {
  it('emits the full field path when a root field is toggled', async () => {
    const wrapper = mountField(new Set())

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('toggle-field')).toEqual([['messages']])
  })

  it('emits the full field path when a nested array item is toggled', async () => {
    const wrapper = mountField(new Set(['messages']))

    const nested = wrapper.findAllComponents(FieldItem).find(c => c.props('fieldName') === '[0]')
    expect(nested).toBeDefined()
    expect(nested!.props('fieldPath')).toBe('messages[0]')

    await nested!.find('button').trigger('click')

    expect(wrapper.emitted('toggle-field')).toEqual([['messages[0]']])
  })

  it('expands a nested array item whose full path is in the expanded set', () => {
    const wrapper = mountField(new Set(['messages', 'messages[0]']))

    const paths = wrapper.findAllComponents(FieldItem).map(c => c.props('fieldPath'))

    expect(paths).toContain('messages[0].role')
    expect(paths).not.toContain('messages[1].role')
  })
})
