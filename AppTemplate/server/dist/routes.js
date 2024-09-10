"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respond = void 0;
const recursive_url_1 = require("@langchain/community/document_loaders/web/recursive_url");
;
const text_splitter_1 = require("langchain/text_splitter");
const memory_1 = require("langchain/vectorstores/memory");
const openai_1 = require("@langchain/openai");
const hub_1 = require("langchain/hub");
const output_parsers_1 = require("@langchain/core/output_parsers");
const combine_documents_1 = require("langchain/chains/combine_documents");
require('dotenv').config();
const html_to_text_1 = require("html-to-text");
/*There are one main functionality the server needs to provide:
1) get model response for a prompt (GET)
*/
let chatbot = undefined;
let contextGenerator = undefined;
const initializeChatbot = async (url) => {
    const llm = new openai_1.ChatOpenAI({
        model: "gpt-4o",
        apiKey: process.env.OPENAI_API_KEY,
        temperature: 0.6
    });
    const compiledConvert = (0, html_to_text_1.compile)({ wordwrap: 130 });
    const loader = new recursive_url_1.RecursiveUrlLoader(url, { extractor: compiledConvert, });
    const docs = await loader.load();
    const textSplitter = new text_splitter_1.RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });
    const splits = await textSplitter.splitDocuments(docs);
    const vectorStore = await memory_1.MemoryVectorStore.fromDocuments(splits, new openai_1.OpenAIEmbeddings());
    contextGenerator = vectorStore.asRetriever();
    const prompt = await (0, hub_1.pull)("rlm/rag-prompt");
    chatbot = await (0, combine_documents_1.createStuffDocumentsChain)({
        llm,
        prompt,
        outputParser: new output_parsers_1.StringOutputParser(),
    });
};
const getChatbotAnswer = async (prompt) => {
    //Here we assume that chatbot and contextGenerator have been initialized
    const retrievedDocs = await contextGenerator.invoke(prompt);
    const response = await chatbot.invoke({
        question: prompt,
        context: retrievedDocs,
    });
    return response;
};
/**
 * Get the chatbot's reponse to a prompt
 * @param req A container for the client's request
 * @param res A container for the server's response
 */
const respond = async (req, res) => {
    const userEntry = first(req.query.prompt);
    if (userEntry === undefined || userEntry === "") {
        res.status(400).send('Malformed prompt.');
        return;
    }
    if (chatbot === undefined) {
        await initializeChatbot(process.env.URL);
    }
    const response = await getChatbotAnswer(userEntry);
    if (response === undefined) {
        res.status(500).send('Something went wrong on our end :(');
    }
    res.send({ response: response }); //Send the chatbot's response
};
exports.respond = respond;
//Helper method that returns the (first) value of a parameter if any was given.
const first = (param) => {
    if (Array.isArray(param)) {
        return first(param[0]);
    }
    else if (typeof param === 'string') {
        return param;
    }
    else {
        return undefined;
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3JvdXRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFHQSwyRkFBNkY7QUFBQSxDQUFDO0FBQzlGLDJEQUF5RTtBQUN6RSwwREFBa0U7QUFDbEUsOENBQWlFO0FBQ2pFLHVDQUFxQztBQUVyQyxtRUFBb0U7QUFDcEUsMEVBQStFO0FBQy9FLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQTtBQUUxQiwrQ0FBb0M7QUFNcEM7O0VBRUU7QUFFRixJQUFJLE9BQU8sR0FBUSxTQUFTLENBQUM7QUFDN0IsSUFBSSxnQkFBZ0IsR0FBUSxTQUFTLENBQUM7QUFFdEMsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLEVBQUUsR0FBVSxFQUFpQixFQUFFO0lBQzVELE1BQU0sR0FBRyxHQUFHLElBQUksbUJBQVUsQ0FBQztRQUN6QixLQUFLLEVBQUUsUUFBUTtRQUNmLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGNBQWM7UUFDbEMsV0FBVyxFQUFFLEdBQUc7S0FDakIsQ0FBQyxDQUFDO0lBRUgsTUFBTSxlQUFlLEdBQUcsSUFBQSxzQkFBTyxFQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFFbkQsTUFBTSxNQUFNLEdBQUcsSUFBSSxrQ0FBa0IsQ0FBQyxHQUFHLEVBQUUsRUFBQyxTQUFTLEVBQUUsZUFBZSxHQUFFLENBQUMsQ0FBQztJQUUxRSxNQUFNLElBQUksR0FBRyxNQUFNLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUVqQyxNQUFNLFlBQVksR0FBRyxJQUFJLDhDQUE4QixDQUFDO1FBQ3RELFNBQVMsRUFBRSxJQUFJO1FBQ2YsWUFBWSxFQUFFLEdBQUc7S0FDbEIsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxNQUFNLEdBQUcsTUFBTSxZQUFZLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZELE1BQU0sV0FBVyxHQUFHLE1BQU0sMEJBQWlCLENBQUMsYUFBYSxDQUN2RCxNQUFNLEVBQ04sSUFBSSx5QkFBZ0IsRUFBRSxDQUN2QixDQUFDO0lBRUYsZ0JBQWdCLEdBQUcsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzdDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBQSxVQUFJLEVBQXFCLGdCQUFnQixDQUFDLENBQUM7SUFFaEUsT0FBTyxHQUFHLE1BQU0sSUFBQSw2Q0FBeUIsRUFBQztRQUN4QyxHQUFHO1FBQ0gsTUFBTTtRQUNOLFlBQVksRUFBRSxJQUFJLG1DQUFrQixFQUFFO0tBQ3ZDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQTtBQUVELE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxFQUFDLE1BQWMsRUFBbUIsRUFBRTtJQUNoRSx3RUFBd0U7SUFDeEUsTUFBTSxhQUFhLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFFNUQsTUFBTSxRQUFRLEdBQUcsTUFBTSxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ3BDLFFBQVEsRUFBRSxNQUFNO1FBQ2hCLE9BQU8sRUFBRSxhQUFhO0tBQ3ZCLENBQUMsQ0FBQztJQUVILE9BQU8sUUFBUSxDQUFBO0FBQ2pCLENBQUMsQ0FBQTtBQUVEOzs7O0dBSUc7QUFDSSxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUMsR0FBZSxFQUFFLEdBQWdCLEVBQWlCLEVBQUU7SUFDL0UsTUFBTSxTQUFTLEdBQW9CLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQzFELElBQUksU0FBUyxLQUFLLFNBQVMsSUFBSSxTQUFTLEtBQUssRUFBRSxFQUFDO1FBQzlDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUE7UUFDekMsT0FBTztLQUNSO0lBQ0QsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFDO1FBQ3hCLE1BQU0saUJBQWlCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFJLENBQUMsQ0FBQTtLQUMxQztJQUNELE1BQU0sUUFBUSxHQUFxQixNQUFNLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFBO0lBQ3BFLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBQztRQUN6QixHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFBO0tBQzNEO0lBQ0QsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUMsQ0FBQyxDQUFDLENBQUMsNkJBQTZCO0FBQy9ELENBQUMsQ0FBQTtBQWRZLFFBQUEsT0FBTyxXQWNuQjtBQUVELCtFQUErRTtBQUMvRSxNQUFNLEtBQUssR0FBRyxDQUFDLEtBQWMsRUFBb0IsRUFBRTtJQUNqRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDeEIsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDeEI7U0FBTSxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUNwQyxPQUFPLEtBQUssQ0FBQztLQUNkO1NBQU07UUFDTCxPQUFPLFNBQVMsQ0FBQztLQUNsQjtBQUNILENBQUMsQ0FBQyJ9