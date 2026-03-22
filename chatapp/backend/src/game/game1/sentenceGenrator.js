import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const generateRaceSentence = async () => {

    try {

        const completion = await groq.chat.completions.create({

            messages: [
                {
                    role: "system",
                    content: "Generate sentences for a typing race game"
                },
                {
                    role: "user",
                    content:
                        "Generate a short sentence for typing race between 20 and 35 words simple English no punctuation return only sentence.reminding it must be short of 20-40 words okay and give me only sentence"
                }
            ],

            model: "llama-3.1-8b-instant",
            temperature: 0.8
        });

        const sentence =
            completion.choices[0]?.message?.content ||
            "the quick brown fox jumps over the lazy dog while the small cat watches from the wooden fence beside the quiet village road";

        return sentence
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .trim();

    } catch (error) {

        console.error("Groq Error:", error);

        return "the quick brown fox jumps over the lazy dog while the small cat watches from the wooden fence beside the quiet village road";
    }
};