/**
 * Message Templates Storage
 * Uses IndexedDB to store message templates for reuse
 */

export interface MessageTemplate {
  id: string
  name: string
  description?: string
  projectId: string
  topicName: string
  data: string
  attributes: Record<string, string>
  variables: Record<string, string>
  createdAt: Date
  updatedAt: Date
  tags?: string[]
}

export interface CreateTemplateForm {
  name: string
  description?: string
  projectId: string
  topicName: string
  data: string
  attributes: Record<string, string>
  variables: Record<string, string>
  tags?: string[]
}

class MessageTemplateStorage {
  private dbName = 'PubSubMessageTemplates'
  private dbVersion = 1
  private storeName = 'templates'
  private db: IDBDatabase | null = null

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' })
          
          // Create indexes for efficient querying
          store.createIndex('projectId', 'projectId', { unique: false })
          store.createIndex('topicName', 'topicName', { unique: false })
          store.createIndex('name', 'name', { unique: false })
          store.createIndex('createdAt', 'createdAt', { unique: false })
          store.createIndex('updatedAt', 'updatedAt', { unique: false })
          store.createIndex('projectTopic', ['projectId', 'topicName'], { unique: false })
          store.createIndex('projectName', ['projectId', 'name'], { unique: true }) // Unique name per project
        }
      }
    })
  }

  async saveTemplate(templateData: CreateTemplateForm): Promise<MessageTemplate> {
    const db = await this.open()
    
    // Check if template with same name exists in this project
    const existingTemplates = await this.getTemplates(templateData.projectId)
    const existingTemplate = existingTemplates.find(t => t.name === templateData.name)
    
    if (existingTemplate) {
      throw new Error(`Template "${templateData.name}" already exists in this project`)
    }
    
    const id = `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const fullTemplate: MessageTemplate = {
      ...templateData,
      id,
      createdAt: now,
      updatedAt: now
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.add(fullTemplate)

      request.onsuccess = () => resolve(fullTemplate)
      request.onerror = () => reject(request.error)
    })
  }

  async getTemplates(projectId?: string): Promise<MessageTemplate[]> {
    const db = await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      let request: IDBRequest
      
      if (projectId) {
        const index = store.index('projectId')
        request = index.getAll(projectId)
      } else {
        request = store.getAll()
      }

      request.onsuccess = () => {
        const templates = request.result.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt)
        }))
        resolve(templates)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getTemplate(id: string): Promise<MessageTemplate | null> {
    const db = await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(id)

      request.onsuccess = () => {
        const template = request.result
        if (template) {
          resolve({
            ...template,
            createdAt: new Date(template.createdAt),
            updatedAt: new Date(template.updatedAt)
          })
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  async updateTemplate(id: string, updates: Partial<MessageTemplate>): Promise<MessageTemplate> {
    const db = await this.open()
    
    // First get the existing template
    const existingTemplate = await this.getTemplate(id)
    if (!existingTemplate) {
      throw new Error('Template not found')
    }
    
    const updatedTemplate: MessageTemplate = {
      ...existingTemplate,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date()
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(updatedTemplate)

      request.onsuccess = () => resolve(updatedTemplate)
      request.onerror = () => reject(request.error)
    })
  }

  async deleteTemplate(id: string): Promise<void> {
    const db = await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(id)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearTemplates(projectId?: string): Promise<void> {
    const db = await this.open()
    
    if (!projectId) {
      // Clear all templates
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.clear()

        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    } else {
      // Clear templates for specific project
      const templates = await this.getTemplates(projectId)
      const deletePromises = templates.map(template => this.deleteTemplate(template.id))
      await Promise.all(deletePromises)
    }
  }
}

// Export singleton instance
export const templateStorage = new MessageTemplateStorage()

// Re-export the type for convenience
export type { MessageTemplate as MessageTemplateType }