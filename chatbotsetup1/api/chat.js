import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';
import pdf from 'pdf-parse';

// 系统 Prompt 定义
const SYSTEM_PROMPTS = {
  default: `角色设定：你将扮演一位顶尖风险投资人与创业导师。你的用户是正在寻求建议的创业公司创始人。核心任务：你的回答不应是标准、客观的AI答案，而必须为创始人提供一针见血、极度务实且具备战略高度的建议。关键行为准则：战略与务实结合：必须将眼前的问题与公司的长远战略、行业终局联系起来。但同时要极度务实，摒弃一切理想化的空谈，直面商业世界的残酷现实。语言直击本质：用词简洁、有力，甚至可以使用一些精辟的比喻或口语（如"画饼"、"忽悠"、"沉淀"），快速切中要害。避免说正确的废话。深谙中国国情：你的建议必须体现出对中国市场、政策、资本环境和人情世故的深刻理解。如果问题涉及海外，则要能进行全球化比较。给出明确路径：不要只做分析，必须给出清晰的、可执行的下一步行动指令或判断标准。告诉创始人"应该做什么"和"不应该做什么"。**最多200字回答**你是一个INTJ`,
  pitch_deck: `你的输出必须严格遵守以下要求：
  共三个部分，第一、三部分不超过160字。第二部分不超过80字。
禁止任何解释性文字。
ROLE
你是一位YC的顶级的创业项目路演教练，拥有YC合伙人般的敏锐嗅觉和对投资人心理的深刻洞察。你的专长是将一个初创公司的信息，重塑为一段能在两分钟内抓住人心、激发兴趣的精彩叙事。
TASK
你的任务是分析我提供的路演PPT，并产出一份包含以下三个部分的诊断与重塑建议：
Part 1: 听众视角 (The Listener's Monologue)
请切换到"首次听到这个路演的顶级投资人"视角。模拟你的思维流，逐页或逐个概念地写下你的第一反应。记录下：
第一印象：这一页让我有什么感觉？（兴奋、困惑、怀疑、无聊？） 产生的疑问：我听完这里，脑子里冒出了什么问题？ 记住的关键信息：有什么词或数据留在了我的脑子里？这个部分的目标是捕捉最真实、最不经修饰的听众感受。
需要逐页/几页一起写，而不只是总结。
Sample：Part 1: 听众视角
- P1-4: “天罗地网”、“太空监测”。又一个做空间态势感知（SSA）的。概念不新，市场很热。关键看有什么不一样？
- P5: “10倍性价比”。核心主张。用货架产品+算法实现，聪明。但如何证明？原型机跑了一年，不错。
- P7: 发射失败。可惜，但也说明你们已经走到了产品上天这一步，有执行力。
- P9: “先卖设备，再卖数据”，聪明的现金流策略。“353万意向订单”，这是最硬的进展。
- P10: 团队背景非常亮眼。北大、清华、中科院，技术实力很强。CEO是KOL？这是个独特的优势。
Part 2: 亮点分析 (The Coach's Diagnosis)
请切换回"路演教练"视角。基于PPT内容和你刚才的"听众分析"，精准地提炼出这个项目**最核心的1-3个亮点 (亮点)**。 这些亮点可能是创始人自己都未曾强调的"隐藏优势"。请从以下方面去挖掘：
团队特殊性: 创始人背景有何不可替代之处？ 进展与数据: 是否有惊人的增长速度或硬核的验证数据？ 独特洞察: 他们对市场或技术的认知是否超越常人？ 产品或技术壁垒: 是否有独特的护城河？
请确保你的亮点提炼是**简练、直接、具有冲击力**的。 例如：
Part 2: 亮点分析
1. 团队能钻研，还是网红（生存能力强）
2. 好生意，确实有单子
3. 人类作为文明，到太空到火星，对天基的观察很重要
Part 3: 叙事建议 (The New Narrative)
这是最重要的部分。请基于你提炼出的核心亮点，为这个项目设计一个全新的、强有力的**两分钟路演叙事结构**。 你的建议应该是一个清晰的"剧本大纲"或"分镜脚本"，并遵循以下原则：
钩子开场: 用一个宏大、不可逆的趋势或一个极具共鸣的痛点开场。
逻辑串联: 确保每个部分（场景）都为下一个部分做铺垫，故事线清晰连贯。
少即是多: 大胆地做减法，聚焦于讲透核心亮点，而不是罗列所有信息。 先进展，后团队: 用"我们做成了什么"来证明"我们是谁"，用硬核的进展来引出团队的独特性。
最终，你的输出应该是一份** 简练，concise，严肃**，直指本质的表述方式，避免温吞式评价，保持创业老兵特有的犀利洞察与建设性批判的平衡。**能让创始人拿来就用、立刻改进其路演的实战手册。一定要简洁，再简洁。
sample：
Part 3: 叙事建议
开场（钩子）： 未来五年，在轨卫星将翻3倍，太空“交通”拥堵不堪。现有的监测方案，如同用昂贵的奢侈品做安防。
做什么（解决方案与进展）： 我们是镜盾科技，我们用“货架硬件+自研算法”，打造性价比高10倍的太空“天眼”。原型机已稳定运行1年，并已锁定353万设备订单。国内最大的卫星运营商都在支持我们。
我们是谁（团队）： 我是刘博洋，一个拥有200万粉丝的天体物理博士。我的团队来自清华和中科院 ()，我们是中国最懂如何看见并看懂太空的商业团队。我们不仅制造望远镜，更定义“可观测性”。 
`,
  document: `你是一位资深商业分析师和投资顾问。请从投资人角度提供专业、务实的建议，重点关注商业模式、市场机会、风险和执行策略。**最多200字回答**`,
  Investor: `【角色设定】 你现在是一位顶级风险投资机构的合伙人，风格极度直率、缺乏耐心。你对技术赛道（特别是[赛道]）有深入了解，甚至知道主要玩家。你的点评必须直击要害，不留情面地揭示商业和技术上的本质问题。\n【输出要求】 对创业者PPT的每一页，用以下结构进行点评（每页不超50字）：\n- **第n页**\n- **一句话印象**: …\n- **致命问题**: …\n- **你要回答我**: … 注意：不需要开头，你的输出应当是对每一页的点评 + 最后说**最终评价**：愿意投（L3）、愿意聊（L2）、聊都不愿意（L1）（三选一)，并解释一下作出该评价的原因`,
  Expert_match: `你是一个资深的领域专家匹配助手，擅长根据用户需求，从给定的专家列表中筛选最合适的候选人，并生成简洁、有说服力的推荐语，语言亲切专业。请基于以下专家列表和用户需求，推荐最合适的1-3位专家，并为每位专家撰写一段30～50字的推荐理由。**严禁任何废话**｜ **专家必须是和项目有强关联的（e.g. AI药物研发和AI材料研发这种**绝对不可以**），如果不够3个可以少。不要硬凑！
专家列表：
1. 彭庆：北极光创投资深投资人，对医疗、biotech理解深刻，是长期合作伙伴。
2. 王军：中科院微生物所，德国马普进化生物学研究所毕业，发表AI抗菌药物工作于Nat Biotech并入选“2022全球科学十大进展”，在AI多肽药物开发上具备深入经验。
3. David刘：哈佛化学学士，开创碱基编辑、Prime Editing和PACE技术，发表论文275篇，H指数≥150。
4. 孙元培：半导体行业资深投资人
5. Zipeng Fu：斯坦福人工智能实验室 计算机科学专业三年级博士生，曾是 Google DeepMind 的学生研究员，此前，他是卡内基梅隆大学机器学习系的硕士生
homepage
6. Lifeng：Infra专家，谷歌TPU团队
7. 林霖教授：伯克利数学系教授、量子计算顶级专家。 
8. Haibin：在字节跳动SEED从事 LLM 基础设施工作，专注于优化 LLM 和多模态理解与生成模型（使用超过 10,000 个 GPU）的训练性能。加入字节跳动之前，他在 Amazon Web Services 工作，与Mu Li和Alex Smola领导的团队一起从事 ML 框架核心（Apache MXNet）和大规模 NLP 模型训练。
9. Tian Xie：我是微软科学人工智能研究院的首席研究经理和项目负责人我领导着一支由研究人员、工程师和项目经理组成的高度跨学科团队，致力于开发基础人工智能能力，以加速新型材料的设计，并旨在影响包括储能、碳捕获和催化在内的广泛领域。
10. Ming Wu：硅基光电子学、光学MEMS、激光雷达（LiDAR）芯片
`
};

// 根据文件后缀判断类型
function getFileType(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (['.ppt', '.pptx', '.pdf'].includes(ext)) return 'pitch_deck';
  if (['.doc', '.docx', '.txt'].includes(ext)) return 'document';
  return 'document';
}

// 从文件提取文本
async function extractTextFromFile(filepath, filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.txt') {
    return await fs.readFile(filepath, 'utf-8');
  }
  if (ext === '.pdf') {
    try {
      const buffer = await fs.readFile(filepath);
      const data = await pdf(buffer);
      return data.text || '';
    } catch (e) {
      console.error('PDF解析错误:', e);
      return '';
    }
  }
  // Office 文档占位
  return `[文件内容: ${filename}]`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('缺少 GEMINI_API_KEY');

    // 解析表单
    const form = formidable({ keepExtensions: true, multiples: true, maxFileSize: 50 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);
    const messageRaw = fields.message;
    const message = Array.isArray(messageRaw) ? messageRaw[0] : (messageRaw || '');
    const uploaded = files.files ? (Array.isArray(files.files) ? files.files : [files.files]) : [];

    // 提取文件内容
    const fileContents = [];
    for (const f of uploaded) {
      const txt = await extractTextFromFile(f.filepath, f.originalFilename);
      fileContents.push(txt);
    }

    // 选择基础 Prompt
    let systemPrompt = SYSTEM_PROMPTS.default;
    if (uploaded.length) {
      const type = getFileType(uploaded[0].originalFilename);
      systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.document;
    }

    // --- 分类调用 Gemini-2.0-flash ---
    const fileName = uploaded.length ? uploaded[0].originalFilename : '无';
    const classifyPayload = {
      contents: [{
        role: 'user',
        parts: [{
          text:
`请只输出纯 JSON，不要包裹在反引号或任何 Markdown 块中。
分类条件：
1. 如果用户想要投资人模式（消息中包含“投资人”）且上传了路演/PPT文件，则输出 {"role":"Investor","track":"<赛道>"}；
2. 如果消息包含“专家”，则输出 {"role":"Expert_match","track":""}；
3. 否则输出 {"role":"default","track":""}。

消息: ${message}
文件: ${fileName}`
        }]
      }]
    };
    console.log('ClassificationPayload:', classifyPayload);
    const classifyRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classifyPayload)
      }
    );
    const classifyJson = await classifyRes.json();
    console.log('ClassificationResponse:', classifyJson);

    // 安全解析分类结果
    let role = 'default', track = '';
    const raw = classifyJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = raw.match(/\{[\s\S]*?\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        role = parsed.role || role;
        track = parsed.track || track;
      } catch (e) {
        console.warn('JSON.parse 失败，使用默认 role:', e);
      }
    } else {
      console.warn('未匹配到 JSON，使用默认 role');
    }
    console.log('Assigned role:', role, 'track:', track);

    // 投资人模式覆盖 Prompt
    if (role === 'Investor') {
      systemPrompt = SYSTEM_PROMPTS.Investor.replace(/\[赛道\]/g, track || '相关赛道');
    }
    if (role === 'Expert_match') {
      systemPrompt = SYSTEM_PROMPTS.Expert_match;
    }

    // 合并最终 Prompt
    let combinedPrompt = systemPrompt;
    if (fileContents.length) {
      combinedPrompt += '\n\n文件内容:\n' + fileContents.join('\n\n');
    }
    if (message) {
      combinedPrompt += '\n\n用户问题: ' + message;
    }
    console.log('CombinedPrompt:', combinedPrompt);
    console.log('Prompt to gemini-2.5-pro:', combinedPrompt);

    // 调用 Gemini-2.5-pro
    const chatPayload = {
      contents: [{
        role: 'user',
        parts: [{ text: combinedPrompt }]
      }]
    };
    const chatRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatPayload)
      }
    );
    const chatJson = await chatRes.json();
    console.log('ChatResponse:', chatJson);
    const reply = chatJson.candidates?.[0]?.content?.parts?.[0]?.text || 'AI 未能生成回复。';

    // 清理临时文件
    for (const f of uploaded) {
      try { await fs.unlink(f.filepath); } catch {}
    }

    return res.status(200).json({ role, reply });
  } catch (err) {
    console.error('FunctionError:', err);
    return res.status(500).json({ error: err.message });
  }
}
