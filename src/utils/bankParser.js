/**
 * 题库导入解析与样例数据工具
 * 支持 JSON 与 CSV 格式，涵盖：单选题、多选题、判断题
 */

// 1. JSON 格式示例模板 (涵盖三种经典题型)
export const JSON_SAMPLE = JSON.stringify([
  {
    "id": 1,
    "type": "单选题",
    "category": "综合通识",
    "question": "我国首个自主研发的太空空间站全称是？",
    "options": {
      "A": "天宫空间站",
      "B": "和平号空间站",
      "C": "国际空间站",
      "D": "天舟空间站"
    },
    "answer": "A"
  },
  {
    "id": 2,
    "type": "多选题",
    "category": "科学技术",
    "question": "下列属于清洁可再生能源的有哪些？",
    "options": {
      "A": "太阳能",
      "B": "风力发电",
      "C": "水力发电",
      "D": "燃煤火电"
    },
    "answer": ["A", "B", "C"]
  },
  {
    "id": 3,
    "type": "判断题",
    "category": "物理常识",
    "question": "光在真空中的传播速度约为每秒 30 万公里。（）",
    "options": {
      "A": "正确",
      "B": "错误"
    },
    "answer": "A"
  }
], null, 2)

// 2. CSV 格式示例模板 (涵盖三种经典题型，表头与数据)
export const CSV_SAMPLE = `题型,专题分类,题目内容,选项A,选项B,选项C,选项D,正确答案
单选题,综合通识,我国首个自主研发的太空空间站全称是？,天宫空间站,和平号空间站,国际空间站,天舟空间站,A
多选题,科学技术,下列属于清洁可再生能源的有哪些？,太阳能,风力发电,水力发电,燃煤火电,ABC
判断题,物理常识,光在真空中的传播速度约为每秒 30 万公里。（）,正确,错误,,,A`

/**
 * 健壮的 CSV 解析器（支持单元格内双引号、逗号与换行转义）
 */
export function parseQuestionsCsv(csvText) {
  if (!csvText || !csvText.trim()) {
    throw new Error('CSV 内容不能为空')
  }

  const rows = []
  let currentRow = []
  let currentCell = ''
  let insideQuotes = false

  const text = csvText.trim()
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"'
        i++
      } else {
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ''
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++
      }
      currentRow.push(currentCell.trim())
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow)
      }
      currentRow = []
      currentCell = ''
    } else {
      currentCell += char
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim())
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow)
    }
  }

  if (rows.length < 2) {
    throw new Error('CSV 文件行数不足，请确保包含表头和至少一行题目数据')
  }

  // 表头匹配
  const headers = rows[0].map(h => h.trim().toLowerCase())
  const findCol = (...aliases) => headers.findIndex(h => aliases.some(a => h.includes(a.toLowerCase())))

  const typeIdx = findCol('type', '题型', '类型')
  const catIdx = findCol('category', '分类', '专题', '模块')
  const qIdx = findCol('question', '题目', '题干', 'title', '内容')
  const aIdx = findCol('optiona', '选项a', '选项 a', 'a')
  const bIdx = findCol('optionb', '选项b', '选项 b', 'b')
  const cIdx = findCol('optionc', '选项c', '选项 c', 'c')
  const dIdx = findCol('optiond', '选项d', '选项 d', 'd')
  const ansIdx = findCol('answer', '答案', '正确答案')

  const parsedQuestions = []

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || row.length === 0) continue

    const qText = qIdx !== -1 ? (row[qIdx] || '') : (row[2] || '')
    if (!qText.trim()) continue

    const rawType = (typeIdx !== -1 ? row[typeIdx] : '') || ''
    const optA = aIdx !== -1 ? (row[aIdx] || '') : (row[3] || '')
    const optB = bIdx !== -1 ? (row[bIdx] || '') : (row[4] || '')
    const optC = cIdx !== -1 ? (row[cIdx] || '') : (row[5] || '')
    const optD = dIdx !== -1 ? (row[dIdx] || '') : (row[6] || '')
    const rawAns = (ansIdx !== -1 ? (row[ansIdx] || '') : (row[7] || 'A')).toUpperCase().trim()

    // 自动判定题型
    let finalType = '单选题'
    if (rawType.includes('多选') || rawAns.length > 1 || rawAns.includes(',') || rawAns.includes('、')) {
      finalType = '多选题'
    } else if (rawType.includes('判断') || (!optC && !optD && (optA.includes('正确') || optA.includes('对') || optB.includes('错误') || optB.includes('错')))) {
      finalType = '判断题'
    }

    const options = {}
    if (finalType === '判断题') {
      options.A = optA || '正确'
      options.B = optB || '错误'
    } else {
      if (optA) options.A = optA
      if (optB) options.B = optB
      if (optC) options.C = optC
      if (optD) options.D = optD
    }

    let answer
    if (finalType === '多选题') {
      const cleanLetters = rawAns.replace(/[^A-D]/g, '').split('')
      answer = cleanLetters.length > 0 ? Array.from(new Set(cleanLetters)).sort() : ['A', 'B']
    } else {
      answer = rawAns.charAt(0) || 'A'
    }

    parsedQuestions.push({
      id: r,
      type: finalType,
      category: (catIdx !== -1 ? row[catIdx] : '') || '通用练习',
      question: qText,
      options,
      answer,
      answer_str: Array.isArray(answer) ? answer.join('、') : answer
    })
  }

  if (parsedQuestions.length === 0) {
    throw new Error('未在 CSV 中解析到有效题目，请检查列名与题目格式')
  }

  return parsedQuestions
}

/**
 * 统一解析文本或文件内容为题目数组
 */
export function parseQuestionsData(content) {
  if (!content) throw new Error('解析内容为空')
  
  if (Array.isArray(content)) return content
  if (typeof content === 'object') {
    if (Array.isArray(content.questions)) return content.questions
    if (Array.isArray(content.data)) return content.data
  }

  const str = String(content).trim()
  if (str.startsWith('[') || str.startsWith('{')) {
    try {
      const json = JSON.parse(str)
      if (Array.isArray(json)) return json
      if (Array.isArray(json.questions)) return json.questions
      if (Array.isArray(json.data)) return json.data
      throw new Error('JSON 格式不符：顶层需为题目数组或包含 questions 列表的对象')
    } catch (e) {
      if (str.includes(',') && str.includes('\n')) {
        // 尝试作为 CSV 解析
        return parseQuestionsCsv(str)
      }
      throw new Error('JSON 格式解析错误: ' + e.message)
    }
  }

  // 默认作为 CSV 解析
  return parseQuestionsCsv(str)
}
