import { ChatGPTAPI } from 'chatgpt-hashkey';
import pTimeout from 'p-timeout';
import config from './config';
import { retryRequest } from './utils';

const conversationMap = new Map();

const chatGPT = new ChatGPTAPI({
  apiKey: config.apiKey,
  debug: true,
  completionParams: {
    model: 'text-davinci-003',
    temperature: 0.9,
    presence_penalty: 0.9,
  }
});

export function resetConversation(contactId) {
  if (conversationMap.has(contactId)) {
    conversationMap.delete(contactId);
  }
}

function getConversation(contactId) {
  console.log('getConversation====== ' + contactId);
  if (conversationMap.has(contactId)) {
    return conversationMap.get(contactId);
  }
  return {};
}

function addConversation(contactId, params) {
  const conversation = {
    conversationId: params.conversationId,
    parentMessageId: params.id,
  };
  console.log(
    'adding conversation for ' +
      contactId +
      ', params are  ' +
      JSON.stringify(conversation)
  );
  conversationMap.set(contactId, conversation);
}

async function getChatGPTReply(content, contactId) {
  const currentConversation = getConversation(contactId);
  // send a message and wait for the response
  const threeMinutesMs = 3 * 60 * 1000;
  const response = await pTimeout(
    chatGPT.sendMessage(content, currentConversation),{
      milliseconds: threeMinutesMs,
      message: 'ChatGPT timed out waiting for response',
    }
  );
  console.log('response: ', response);
  // response is a markdown-formatted string
  if (response.text) {
    addConversation(contactId, response);
    return response.text;
  } else {
    return '我不知道怎么帮你';
  }
}

export async function replyMessage(content, contactId) {
  try {
    const message = await retryRequest(
      () => getChatGPTReply(content, contactId),
      config.retryTimes,
      500
    );
    return message
    
  } catch (e) {
    console.error(e);
    if (e.message.includes('timed out')) {
      return content +
        '\n-----------\n错误: ChatGPT 调用超时.'
    }
    conversationMap.delete(contactId);
  }
}
