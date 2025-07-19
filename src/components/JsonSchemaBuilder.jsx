import React, { useState } from 'react'

// Move idCounter outside the component so it doesn't reset on every render
let idCounter = 0

// Field component for rendering individual fields - moved outside to prevent recreation
const FieldComponent = ({ field, depth = 0, updateField, deleteField, addField }) => {
    const indentClass = depth > 0 ? `ml-${depth * 8}` : ''

    return (
        <div className={`mb-4 ${indentClass}`}>
            <div className="flex items-center gap-3 mb-2">
                <input
                    type="text"
                    value={field.name}
                    onChange={(e) => updateField(field.id, 'name', e.target.value)}
                    placeholder="Field name"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />

                <select
                    value={field.type}
                    onChange={(e) => updateField(field.id, 'type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="nested">nested</option>
                </select>

                <label className="flex items-center">
                    <input
                        type="checkbox"
                        checked={false}
                        readOnly
                        className="mr-2"
                    />
                    <span className="text-sm text-gray-600">Required</span>
                </label>

                <button
                    onClick={() => deleteField(field.id)}
                    className="text-red-500 hover:text-red-700 font-bold text-lg"
                >
                    ✕
                </button>
            </div>

            {field.type === 'nested' && (
                <div className="ml-4 border-l-2 border-gray-200 pl-4">
                    {field.children.map(child => (
                        <FieldComponent
                            key={child.id}
                            field={child}
                            depth={depth + 1}
                            updateField={updateField}
                            deleteField={deleteField}
                            addField={addField}
                        />
                    ))}
                    <button
                        onClick={() => addField(field.id)}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        + Add Item
                    </button>
                </div>
            )}
        </div>
    )
}

const JsonSchemaBuilder = () => {
    const [fields, setFields] = useState([])

    // Function to generate a unique ID for each field
    const generateId = () => {
        return ++idCounter
    }

    // Function to add a new field
    const addField = (parentId = null) => {
        const newField = {
            id: generateId(),
            name: '',
            type: 'string',
            parentId: parentId,
            children: []
        }

        if (parentId) {
            // Add as a child to the parent field
            setFields(prev => prev.map(field => {
                if (field.id === parentId) {
                    return { ...field, children: [...field.children, newField] }
                }
                return updateNestedField(field, parentId, newField)
            }))
        } else {
            // Add as a root field
            setFields(prev => [...prev, newField])
        }
    }

    // Helper function to update nested fields recursively
    const updateNestedField = (field, parentId, newField) => {
        if (field.children && field.children.length > 0) {
            return {
                ...field,
                children: field.children.map(child => {
                    if (child.id === parentId) {
                        return { ...child, children: [...child.children, newField] }
                    }
                    return updateNestedField(child, parentId, newField)
                })
            }
        }
        return field
    }

    // Function to update field properties
    const updateField = (fieldId, property, value) => {
        setFields(prev => prev.map(field => updateFieldRecursively(field, fieldId, property, value)))
    }

    // Helper function to update field recursively
    const updateFieldRecursively = (field, fieldId, property, value) => {
        if (field.id === fieldId) {
            const updatedField = { ...field, [property]: value }
            // If type changes to nested, ensure children array exists
            if (property === 'type' && value === 'nested') {
                updatedField.children = updatedField.children || []
            }
            return updatedField
        }

        if (field.children && field.children.length > 0) {
            return {
                ...field,
                children: field.children.map(child => updateFieldRecursively(child, fieldId, property, value))
            }
        }

        return field
    }

    // Function to delete a field
    const deleteField = (fieldId) => {
        setFields(prev => prev.filter(field => field.id !== fieldId).map(field => deleteFieldRecursively(field, fieldId)))
    }

    // Helper function to delete field recursively
    const deleteFieldRecursively = (field, fieldId) => {
        if (field.children && field.children.length > 0) {
            return {
                ...field,
                children: field.children.filter(child => child.id !== fieldId).map(child => deleteFieldRecursively(child, fieldId))
            }
        }
        return field
    }

    // Function to generate JSON schema
    const generateJsonSchema = () => {
        const schema = {}

        fields.forEach(field => {
            if (field.name.trim()) {
                schema[field.name] = generateFieldValue(field)
            }
        })

        return schema
    }

    // Helper function to generate field value based on type
    const generateFieldValue = (field) => {
        switch (field.type) {
            case 'string':
                return 'STRING'
            case 'number':
                return 'number'
            case 'nested':
                const nestedObject = {}
                field.children.forEach(child => {
                    if (child.name.trim()) {
                        nestedObject[child.name] = generateFieldValue(child)
                    }
                })
                return nestedObject
            default:
                return ''
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Schema Builder Panel */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">Schema Builder</h2>

                    <div className="space-y-4">
                        {fields.map(field => (
                            <FieldComponent
                                key={field.id}
                                field={field}
                                updateField={updateField}
                                deleteField={deleteField}
                                addField={addField}
                            />
                        ))}
                        <button
                            onClick={() => addField()}
                            className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors font-medium"
                        >
                            + Add Item
                        </button>
                    </div>

                    <button
                        onClick={() => console.log('Form submitted:', generateJsonSchema())}
                        className="mt-6 bg-gray-500 text-white py-2 px-6 rounded-md hover:bg-gray-600 transition-colors"
                    >
                        Submit
                    </button>
                </div>

                {/* JSON Preview Panel */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4">JSON Preview</h2>
                    <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm">
                        {JSON.stringify(generateJsonSchema(), null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    )
}

export default JsonSchemaBuilder





