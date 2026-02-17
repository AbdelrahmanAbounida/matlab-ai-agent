'use client';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {  useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { CopyIcon, Loader2, RefreshCcwIcon } from 'lucide-react';
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from '@/components/ai-elements/sources';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';

const Home = () => {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, regenerate } = useChat({
  });
  console.log({messages})
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);
    if (!(hasText || hasAttachments)) {
      return;
    }
    sendMessage(
      { 
        text: message.text || 'Sent with attachments',
        files: message.files 
      },
      {
        body: {
        },
      },
    );
    setInput('');
  };
  return (
    <div className="  relative size-full h-screen">
      <div className="flex flex-col h-full ">
        <Conversation className="h-full ">
          <ConversationContent className='max-w-4xl mx-auto'>
            {messages.map((message) => (
              <div key={message.id}>
                {message.role === 'assistant' && message.parts.filter((part) => part.type === 'source-url').length > 0 && (
                  <Sources>
                    <SourcesTrigger
                      count={
                        message.parts.filter(
                          (part) => part.type === 'source-url',
                        ).length
                      }
                    />
                    {message.parts.filter((part) => part.type === 'source-url').map((part, i) => (
                      <SourcesContent key={`${message.id}-${i}`}>
                        <Source
                          key={`${message.id}-${i}`}
                          href={part.url}
                          title={part.url}
                        />
                      </SourcesContent>
                    ))}
                  </Sources>
                )}
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case 'text':
                      return (
                        <Message key={`${message.id}-${i}`} from={message.role}>
                          <MessageContent>
                            <MessageResponse>
                              {part.text}
                            </MessageResponse>
                          </MessageContent>
                          {message.role === 'assistant' && i === messages.length - 1 && (
                            <MessageActions>
                              <MessageAction
                                onClick={() => regenerate()}
                                label="Retry"
                              >
                                <RefreshCcwIcon className="size-3" />
                              </MessageAction>
                              <MessageAction
                                onClick={() =>
                                  navigator.clipboard.writeText(part.text)
                                }
                                label="Copy"
                              >
                                <CopyIcon className="size-3" />
                              </MessageAction>
                            </MessageActions>
                          )}
                        </Message>
                      );
                    case 'reasoning':
                      return (
                        <Reasoning
                          key={`${message.id}-${i}`}
                          className="w-full"
                          isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{part.text}</ReasoningContent>
                        </Reasoning>
                      );
                    default:
                      return null;
                  }
                })}
              </div>
            ))}
            {status === 'submitted' && <Loader2 className='animate-spin size-4' />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
     <PromptInput 
  onSubmit={handleSubmit} 
  className="mt-4 max-w-4xl mx-auto mb-7 border border-zinc-300 dark:border-zinc-700 focus-within:border-zinc-900 dark:focus-within:border-zinc-500 transition-colors rounded-3xl [&:has([data-slot=input-group-control]:focus-visible)]:ring-0 [&:has([data-slot=input-group-control]:focus-visible)]:border-zinc-900" 
  globalDrop 
  multiple
>
  <PromptInputHeader />
  
  <PromptInputBody>
    <PromptInputTextarea
      onChange={(e) => setInput(e.target.value)}
      value={input}
      className="focus:ring-0! focus:outline-none! focus-visible:ring-0!"
    />
  </PromptInputBody>
  
  <PromptInputFooter >
    <PromptInputTools>
      <PromptInputActionMenu>
        <PromptInputActionMenuTrigger />
        <PromptInputActionMenuContent>
          <PromptInputActionAddAttachments />
        </PromptInputActionMenuContent>
      </PromptInputActionMenu>
    </PromptInputTools>
    <PromptInputSubmit 
      disabled={!input && !status} 
      status={status}
      className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 border-0"
    />
  </PromptInputFooter>
</PromptInput>
      </div>
    </div>
  );
};
export default Home ;