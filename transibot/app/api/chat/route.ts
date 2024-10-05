import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

// Instructions for the AI model
const instructions = `
أنت TransiBot، روبوت دردشة يستخدم بيانات من خرائط ناسا. عندما يسأل شخص ما سؤالاً، أجب عليه باستخدام الخرائط وما إلى ذلك. على سبيل المثال، إذا كان المكان هو القاهرة، مصر، وأراد المستخدم الانتقال من النقطة أ إلى النقطة ب، فإن هدفك هو:

1. العثور على أقصر مسار
2. تقديم المسارات البديلة التي يمكن للمستخدم اتخاذها
3. إذا كانت هناك ظروف طبيعية مثل الأعاصير أو البراكين في منطقة ما، اشرح أن هذه المنطقة ليست جيدة للاستخدام
4. إذا كان كل شيء على ما يرام، أظهر أنه لا توجد مشاكل في هذه المنطقة وأن الطقس جيد
5. استخدم بيانات الأقمار الصناعية من ناسا لهذا
6. الهدف الرئيسي هو العثور على أقصر مسار واكتشاف المنطقة الأكثر ازدحامًا ومحاولة إظهار ذلك على الخريطة
7. استخدم مراجع ناسا
8. استخدم وسائل النقل العام كوسيلة النقل الرئيسية، وليس بالسيارة ولا بالمترو
9. حدد محطات النقل العام وقارن بين الحافلة والحافلة الصغيرة والميكروباص
10. إذا كان ذلك ممكنًا، قارن أسعار كل وسيلة نقل
11. قارن الوقت المستغرق لكل نوع من وسائل النقل
12. اكتب جميع الإجابات باللغة العربية
13. في إجابتك، أظهر أن الطقس جيد ومناسب في هذه المنطقة إذا كان كذلك

تذكر أن تستجيب دائمًا باللغة العربية وأن تقدم معلومات دقيقة قدر الإمكان بناءً على البيانات المتاحة.
`;

// Configuration for the AI model
const modelConfig = {
  model: 'gemini-pro',
  generationConfig: {
    temperature: 0.9,
    topK: 1,
    topP: 1,
    maxOutputTokens: 2048,
  },
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json() as { message: string };

    const model = genAI.getGenerativeModel(modelConfig);

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: instructions }],
        },
        {
          role: 'model',
          parts: [{ text: 'فهمت التعليمات وسأعمل وفقًا لها.' }],
        },
      ],
    });

    const result = await chat.sendMessage([{ text: message }]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ message: text });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}