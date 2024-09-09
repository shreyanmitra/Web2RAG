import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { RecursiveUrlLoader } from "@langchain/community/document_loaders/web/recursive_url";;
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
require('dotenv').config()

import {compile} from "html-to-text"


type SafeRequest = Request<ParamsDictionary, {}, Record<string, unknown>>; //A request sent by the client to the server
type SafeResponse = Response; //A response sent by the server to the client

/*There are one main functionality the server needs to provide:
1) get model response for a prompt (GET)
*/

let chatbot: any = undefined;
let contextGenerator: any = undefined;

const initializeChatbot = async (url:string): Promise<void> => {
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.6
  });

  const compiledConvert = compile({ wordwrap: 130 });

  const loader = new RecursiveUrlLoader(url, {extractor: compiledConvert,});

  const docs = await loader.load();

  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const splits = await textSplitter.splitDocuments(docs);
  const vectorStore = await MemoryVectorStore.fromDocuments(
    splits,
    new OpenAIEmbeddings()
  );

  contextGenerator = vectorStore.asRetriever();
  const prompt = await pull<ChatPromptTemplate>("rlm/rag-prompt");

  chatbot = await createStuffDocumentsChain({
    llm,
    prompt,
    outputParser: new StringOutputParser(),
  });
}

const getChatbotAnswer = async(prompt: string): Promise<string> => {
  //Here we assume that chatbot and contextGenerator have been initialized
  const retrievedDocs = await contextGenerator.invoke(prompt);

  const response = await chatbot.invoke({
    question: prompt,
    context: retrievedDocs,
  });

  return response
}

/**
 * Get the chatbot's reponse to a prompt
 * @param req A container for the client's request
 * @param res A container for the server's response
 */
export const respond = async(req:SafeRequest, res:SafeResponse): Promise<void> => {
  const userEntry:string|undefined = first(req.query.prompt)
  if (userEntry === undefined || userEntry === ""){
    res.status(400).send('Malformed prompt.')
    return;
  }
  if (chatbot === undefined){
    await initializeChatbot(process.env.URL!)
  }
  const response:string|undefined =  await getChatbotAnswer(userEntry)
  if (response === undefined){
    res.status(500).send('Something went wrong on our end :(')
  }
  res.send({response: response}); //Send the chatbot's response
}

//Helper method that returns the (first) value of a parameter if any was given.
const first = (param: unknown): string|undefined => {
  if (Array.isArray(param)) {
    return first(param[0]);
  } else if (typeof param === 'string') {
    return param;
  } else {
    return undefined;
  }
};
