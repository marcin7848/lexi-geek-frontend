# Word Controller API Documentation

## Base Information
All endpoints require authentication and proper authorization.

---

## 1. Get Words (Paginated)

### Endpoint
```
GET /languages/{languageUuid}/categories/{categoryUuid}/words
```

### Description
Retrieves a paginated list of words for a specific category within a language.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `languageUuid` | UUID | The unique identifier of the language |
| `categoryUuid` | UUID | The unique identifier of the category |

### Query Parameters
- `WordFilterForm` fields (filters)
- `PageableRequest` fields (pagination parameters)

### Response
**Status Code:** `200 OK`

```json
{
  "items": [...],
  "totalElements": 100,
  "totalPages": 10,
  ...
}
```

---

## 2. Get Word by UUID

### Endpoint
```
GET /languages/{languageUuid}/categories/{categoryUuid}/words/{wordUuid}
```

### Description
Retrieves a specific word by its UUID.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `languageUuid` | UUID | The unique identifier of the language |
| `categoryUuid` | UUID | The unique identifier of the category |
| `wordUuid` | UUID | The unique identifier of the word |

### Response
**Status Code:** `200 OK`

```json
{
  "uuid": "word-uuid",
  "wordParts": [...],
  "categories": [...],
  "accepted": true,
  "chosen": false,
  ...
}
```

---

## 3. Create Word

### Endpoint
```
POST /languages/{languageUuid}/categories/{categoryUuid}/words
```

### Description
Creates a new word in the specified category.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `languageUuid` | UUID | The unique identifier of the language |
| `categoryUuid` | UUID | The unique identifier of the category |

### Request Body
```json
{
  "comment": "Optional comment",
  "mechanism": "BASIC",
  "wordParts": [
    {
      "word": "example",
      "answer": "answer text",
      "basicWord": true,
      "position": 0,
      "toSpeech": true,
      "separator": " ",
      "separatorType": "SPACE"
    }
  ]
}
```

### Response
**Status Code:** `201 CREATED`

Returns the created word object.

---

## 4. Update Word

### Endpoint
```
PUT /languages/{languageUuid}/categories/{categoryUuid}/words/{wordUuid}
```

### Description
Updates an existing word.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `languageUuid` | UUID | The unique identifier of the language |
| `categoryUuid` | UUID | The unique identifier of the category |
| `wordUuid` | UUID | The unique identifier of the word |

### Request Body
Same structure as Create Word.

### Response
**Status Code:** `200 OK`

Returns the updated word object.

---

## 5. Delete Word

### Endpoint
```
DELETE /languages/{languageUuid}/categories/{categoryUuid}/words/{wordUuid}
```

### Description
Deletes a word from the system.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `languageUuid` | UUID | The unique identifier of the language |
| `categoryUuid` | UUID | The unique identifier of the category |
| `wordUuid` | UUID | The unique identifier of the word |

### Response
**Status Code:** `204 NO CONTENT`

---

## 6. Accept Word

### Endpoint
```
PATCH /languages/{languageUuid}/categories/{categoryUuid}/words/{wordUuid}/accept
```

### Description
Marks a word as accepted.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `languageUuid` | UUID | The unique identifier of the language |
| `categoryUuid` | UUID | The unique identifier of the category |
| `wordUuid` | UUID | The unique identifier of the word |

### Response
**Status Code:** `200 OK`

Returns the word object with `accepted` set to `true`.

---

## 7. Choose Word

### Endpoint
```
PATCH /languages/{languageUuid}/categories/{categoryUuid}/words/{wordUuid}/choose
```

### Description
Toggles the chosen status of a word.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `languageUuid` | UUID | The unique identifier of the language |
| `categoryUuid` | UUID | The unique identifier of the category |
| `wordUuid` | UUID | The unique identifier of the word |

### Response
**Status Code:** `200 OK`

Returns the word object with toggled `chosen` status.

---

## 8. Update Word Categories

### Endpoint
```
POST /languages/{languageUuid}/words/{wordUuid}/categories
```

### Description
Updates the categories associated with a word. Adds the word to new categories and removes it from categories not in the provided list.

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `languageUuid` | UUID | The unique identifier of the language |
| `wordUuid` | UUID | The unique identifier of the word |

### Request Body
```json
{
  "categoryUuids": [
    "category-uuid-1",
    "category-uuid-2",
    "category-uuid-3"
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `categoryUuids` | List<UUID> | Yes | List of category UUIDs (must contain at least one element) |

### Response
**Status Code:** `200 OK`

Returns the updated word object with its new category associations.

### Validation
- The `categoryUuids` list must contain at least one element
- All category UUIDs must exist and belong to the specified language
- User must have access to all specified categories

### Behavior
1. Verifies access to all specified categories
2. Adds the word to categories that don't currently contain it
3. Removes the word from categories not in the provided list
4. Returns the updated word object

---

## Common Error Responses

### 400 Bad Request
- Invalid request body
- Validation errors
- Empty required fields

### 404 Not Found
- Language not found
- Category not found
- Word not found

### 403 Forbidden
- User doesn't have access to the resource

---

## Example Requests

### Create Word
```bash
curl -X POST "http://localhost:8080/languages/123e4567-e89b-12d3-a456-426614174000/categories/987fcdeb-51a2-43d7-8c9f-123456789abc/words" \
  -H "Content-Type: application/json" \
  -d '{
    "mechanism": "BASIC",
    "wordParts": [
      {
        "word": "hello",
        "answer": "hola",
        "basicWord": true,
        "position": 0,
        "toSpeech": true
      }
    ]
  }'
```

### Update Word Categories
```bash
curl -X POST "http://localhost:8080/languages/123e4567-e89b-12d3-a456-426614174000/words/987fcdeb-51a2-43d7-8c9f-123456789abc/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryUuids": [
      "111e1111-e11b-11d1-a111-111111111111",
      "222e2222-e22b-22d2-a222-222222222222"
    ]
  }'
```

### Accept Word
```bash
curl -X PATCH "http://localhost:8080/languages/123e4567-e89b-12d3-a456-426614174000/categories/987fcdeb-51a2-43d7-8c9f-123456789abc/words/111e1111-e11b-11d1-a111-111111111111/accept"
```

### Delete Word
```bash
curl -X DELETE "http://localhost:8080/languages/123e4567-e89b-12d3-a456-426614174000/categories/987fcdeb-51a2-43d7-8c9f-123456789abc/words/111e1111-e11b-11d1-a111-111111111111"
```

