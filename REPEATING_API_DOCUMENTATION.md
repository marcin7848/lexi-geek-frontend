# Repeating Service API Documentation

## Overview
The Repeating Service provides endpoints for managing spaced repetition sessions for language learning. It implements a spaced repetition algorithm to help users memorize words efficiently.

## Base URL
All endpoints are prefixed with: `/languages/{languageUuid}/repeat-session`

---

## Endpoints

### 1. Start Repeat Session

**POST** `/languages/{languageUuid}/repeat-session`

Creates a new repeat session for the specified language with selected categories and configuration.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| languageUuid | UUID | Yes | The unique identifier of the language |

#### Request Body
```json
{
  "categoryUuids": ["uuid1", "uuid2"],
  "wordCount": 20,
  "method": "BOTH",
  "includeChosen": true
}
```

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| categoryUuids | List<UUID> | Yes | Not empty | List of category UUIDs to include in the session |
| wordCount | Integer | Yes | Min: 1 | Number of words to practice in this session |
| method | CategoryMethod | Yes | - | Learning method: `QUESTION_TO_ANSWER`, `ANSWER_TO_QUESTION`, or `BOTH` |
| includeChosen | Boolean | Yes | - | Whether to prioritize words marked as "chosen" |

#### Response
**Status Code:** `201 Created`

```json
{
  "uuid": "session-uuid",
  "languageUuid": "language-uuid",
  "wordsLeft": 20,
  "method": "BOTH",
  "created": "2025-12-10T10:30:00"
}
```

| Field | Type | Description |
|-------|------|-------------|
| uuid | UUID | Unique identifier of the repeat session |
| languageUuid | UUID | The language this session belongs to |
| wordsLeft | Integer | Number of word slots remaining in the session |
| method | CategoryMethod | The learning method for this session |
| created | LocalDateTime | When the session was created |

#### Business Logic
- Validates language ownership
- Ensures no active session exists for the language
- Filters categories by the selected method
- Selects words that are:
  - Accepted
  - Not yet completed (based on reset time)
  - Prioritized by:
    1. Chosen words (if includeChosen is true)
    2. Words with recent incorrect attempts
    3. Regular words (shuffled)
- Implements word slot calculation (BOTH method words count as 2 slots)
- Shuffles final word queue

#### Error Responses
| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 400 | REPEAT_SESSION_ALREADY_EXISTS | A session already exists for this language |
| 404 | LANGUAGE_NOT_FOUND | Language with given UUID not found |
| 404 | CATEGORY_NOT_FOUND | No eligible categories found |

---

### 2. Get Active Session

**GET** `/languages/{languageUuid}/repeat-session`

Retrieves the current active repeat session for the specified language.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| languageUuid | UUID | Yes | The unique identifier of the language |

#### Response
**Status Code:** `200 OK`

```json
{
  "uuid": "session-uuid",
  "languageUuid": "language-uuid",
  "wordsLeft": 15,
  "method": "BOTH",
  "created": "2025-12-10T10:30:00"
}
```

#### Business Logic
- Validates language ownership
- Calculates remaining word slots dynamically based on:
  - Words remaining in queue
  - Correct answers already given after reset time
  - Session method vs word method compatibility

#### Error Responses
| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 404 | REPEAT_SESSION_NOT_FOUND | No active session found for this language |

---

### 3. Get Next Word

**GET** `/languages/{languageUuid}/repeat-session/next-word`

Retrieves a random word from the current session's word queue.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| languageUuid | UUID | Yes | The unique identifier of the language |

#### Response
**Status Code:** `200 OK`

```json
{
  "uuid": "word-uuid",
  "comment": "Example comment",
  "mechanism": "MANUAL",
  "wordParts": [
    {
      "uuid": "part-uuid",
      "word": "hello",
      "answer": false
    },
    {
      "uuid": "part-uuid",
      "word": "hola",
      "answer": true
    }
  ],
  "method": "QUESTION_TO_ANSWER",
  "categoryMode": "DICTIONARY"
}
```

| Field | Type | Description |
|-------|------|-------------|
| uuid | UUID | Unique identifier of the word |
| comment | String | Optional comment/hint for the word |
| mechanism | WordMechanism | How the word was created: `MANUAL` or `AI` |
| wordParts | List<WordPartDto> | Parts of the word (questions and answers) |
| method | WordMethod | The direction to practice: `QUESTION_TO_ANSWER` or `ANSWER_TO_QUESTION` |
| categoryMode | CategoryMode | Mode of the category: `DICTIONARY` or other modes |

#### Word Method Determination Logic
The method is determined based on:
- **Session Method = BOTH & Word Method = BOTH:**
  - If no correct answers yet: Random choice
  - If one correct answer: Use the opposite method
- **Session Method = BOTH & Word Method != BOTH:**
  - Use the word's specific method
- **Session Method != BOTH:**
  - Use the session method

#### Error Responses
| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 404 | REPEAT_SESSION_NOT_FOUND | No active session found for this language |
| 404 | NO_MORE_WORDS_IN_SESSION | No words remaining in the session queue |

---

### 4. Check Answer

**POST** `/languages/{languageUuid}/repeat-session/words/{wordUuid}/check-answer`

Validates the user's answer for a word and updates the session state.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| languageUuid | UUID | Yes | The unique identifier of the language |
| wordUuid | UUID | Yes | The unique identifier of the word being answered |

#### Request Body
```json
{
  "answers": {
    "0": "hello",
    "1": "hi"
  },
  "method": "ANSWER_TO_QUESTION"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| answers | Map<String, String> | Yes | Map of answer indices to user-provided answers |
| method | WordMethod | Yes | The method used: `QUESTION_TO_ANSWER` or `ANSWER_TO_QUESTION` |

#### Response
**Status Code:** `200 OK`

```json
{
  "correct": true,
  "wordsLeft": 14,
  "sessionActive": true,
  "answerDetails": [
    {
      "userAnswer": "hello",
      "correctAnswer": "hello",
      "isCorrect": true
    },
    {
      "userAnswer": "hi",
      "correctAnswer": "hi",
      "isCorrect": true
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| correct | Boolean | Whether all answers were correct |
| wordsLeft | Integer | Number of word slots remaining in the session |
| sessionActive | Boolean | Whether the session is still active |
| answerDetails | List<AnswerDetail> | Detailed breakdown of each answer |

#### Answer Detail Object
| Field | Type | Description |
|-------|------|-------------|
| userAnswer | String | The answer provided by the user (null if missed) |
| correctAnswer | String | The correct answer |
| isCorrect | Boolean | Whether this specific answer was correct |

#### Business Logic
- Validates language ownership and session existence
- Compares user answers with correct answers (case-insensitive)
- Records statistics (WordStats) for the attempt
- **If Correct:**
  - Calculates new reset time using spaced repetition algorithm
  - Removes word from session queue
- **If Incorrect:**
  - Word remains in queue for another attempt
- Updates session or deletes it if no words remain
- Spaced Repetition Intervals (in days): `[1, 3, 7, 14, 30, 60, 90, 180, 365]`

#### Error Responses
| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 404 | REPEAT_SESSION_NOT_FOUND | No active session found for this language |
| 404 | WORD_NOT_IN_SESSION | The word is not part of the current session |

---

### 5. Reset Session

**DELETE** `/languages/{languageUuid}/repeat-session`

Resets all words in the session and deletes the session.

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| languageUuid | UUID | Yes | The unique identifier of the language |

#### Response
**Status Code:** `204 No Content`

No response body.

#### Business Logic
- Validates language ownership
- Sets reset time to current time for all words in the queue
- Saves all updated words
- Deletes the repeat session

#### Error Responses
| Status Code | Error Code | Description |
|-------------|------------|-------------|
| 404 | REPEAT_SESSION_NOT_FOUND | No active session found for this language |

---

## Enums

### CategoryMethod
- `QUESTION_TO_ANSWER` - Practice translating from question to answer
- `ANSWER_TO_QUESTION` - Practice translating from answer to question
- `BOTH` - Practice in both directions

### WordMethod
- `QUESTION_TO_ANSWER` - Current practice direction: question to answer
- `ANSWER_TO_QUESTION` - Current practice direction: answer to question

### CategoryMode
- `DICTIONARY` - Standard dictionary mode
- Other modes (implementation-specific)

### WordMechanism
- `MANUAL` - Word created manually by user
- `AI` - Word generated by AI

---

## Spaced Repetition Algorithm

The service implements a spaced repetition algorithm with the following characteristics:

### Repetition Intervals
After each correct answer, the reset time is calculated based on repetition count:

| Repetition | Interval |
|------------|----------|
| 1st | 1 day |
| 2nd | 3 days |
| 3rd | 7 days |
| 4th | 14 days |
| 5th | 30 days |
| 6th | 60 days |
| 7th | 90 days |
| 8th | 180 days |
| 9th+ | 365 days |

### Word Prioritization
Words are prioritized in the following order:
1. **Chosen words** - If `includeChosen` is true
2. **Priority words** - Words with recent incorrect attempts (within 3 hours before reset time)
   - Sorted by number of incorrect attempts (descending)
3. **Normal words** - All other eligible words (shuffled)

### Word Slot Calculation
- **Session Method = BOTH & Word Method = BOTH:** 2 slots
- **All other combinations:** 1 slot

This ensures that words requiring practice in both directions are counted appropriately.

---

## Common Error Codes

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| REPEAT_SESSION_ALREADY_EXISTS | 400 | Cannot create session when one already exists |
| REPEAT_SESSION_NOT_FOUND | 404 | No active session found |
| LANGUAGE_NOT_FOUND | 404 | Language does not exist |
| CATEGORY_NOT_FOUND | 404 | No eligible categories found |
| WORD_NOT_IN_SESSION | 404 | Word is not part of the current session |
| NO_MORE_WORDS_IN_SESSION | 404 | Session has no more words to practice |

---

## Example Usage Flow

### Starting a Session
1. **POST** `/languages/{languageUuid}/repeat-session`
   - Select categories and configure session
   - Receive session details with words count

### Practicing Words
2. **GET** `/languages/{languageUuid}/repeat-session/next-word`
   - Get a random word from the queue
   - Display word parts based on the method

3. **POST** `/languages/{languageUuid}/repeat-session/words/{wordUuid}/check-answer`
   - Submit user's answers
   - Receive feedback and updated session state
   - If `sessionActive: true`, repeat from step 2

### Session Completion
- When `wordsLeft` reaches 0, the session is automatically deleted
- Alternatively, use **DELETE** endpoint to manually reset/cancel session

---

## Notes

- Only one active session per language is allowed
- All endpoints require language ownership verification
- Answers are compared case-insensitively
- Word statistics are tracked for every attempt
- Sessions are automatically deleted when all words are completed
- Reset times are calculated using spaced repetition for optimal learning
