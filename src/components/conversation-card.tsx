import { ItemType } from '@openai/realtime-api-beta/dist/lib/client'

const ConversationCard = ({ items }: { items: ItemType[] }) => {
  return (
    <div
      className='conversation-display h-[calc(100vh-12rem)] overflow-y-auto p-4'
      data-conversation-content
    >
      {items.map((item) => {
        return (
          <div
            className={`conversation-item mb-6 ${
              item.role === 'user' ? 'text-right' : 'text-left'
            }`}
            key={item.id}
          >
            <div className={`speaker mb-2 ${item.role || ''}`}>
              <span className='holographic-text text-xs uppercase tracking-wider'>
                [{(item.role || item.type).replaceAll('_', ' ')}]
              </span>
              <span className='ml-2 text-xs text-cyan-500'>
                {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div
              className={`speaker-content inline-block p-4 rounded-lg max-w-[80%] relative ${
                item.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-900 to-blue-900 text-cyan-100 border border-cyan-400'
                  : 'bg-gradient-to-r from-gray-900 to-gray-800 text-green-300 border border-green-400'
              }`}
            >
              {/* Holographic effect overlay */}
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-5 animate-pulse pointer-events-none rounded-lg'></div>
              
              {/* tool response */}
              {item.type === 'function_call_output' && (
                <div className='font-mono text-sm'>{item.formatted.output}</div>
              )}
              {/* tool call */}
              {!!item.formatted.tool && (
                <div className='font-mono text-sm text-yellow-400'>
                  EXEC: {item.formatted.tool.name}({item.formatted.tool.arguments})
                </div>
              )}
              {!item.formatted.tool && item.role === 'user' && (
                <div className='relative z-10'>
                  {item.formatted.transcript ||
                    (item.formatted.audio?.length
                      ? '[ PROCESSING AUDIO DATA... ]'
                      : item.formatted.text || '[ DATA TRANSMITTED ]')}
                </div>
              )}
              {!item.formatted.tool && item.role === 'assistant' && (
                <div className='relative z-10'>
                  {item.formatted.transcript ||
                    item.formatted.text ||
                    '[ RESPONSE TRUNCATED ]'}
                </div>
              )}
            </div>
            {/* 各会話の音声ファイルも取得可能 */}
            {/* {item.formatted.file && (
                      <audio src={item.formatted.file.url} controls />
                    )} */}
          </div>
        )
      })}
      {items.length === 0 && (
        <div className='text-center text-cyan-400 holographic-text mt-20'>
          <div className='mb-4'>
            <div className='inline-block w-3 h-3 bg-cyan-400 rounded-full animate-ping'></div>
            <div className='inline-block w-3 h-3 bg-cyan-400 rounded-full animate-ping ml-2' style={{animationDelay: '0.2s'}}></div>
            <div className='inline-block w-3 h-3 bg-cyan-400 rounded-full animate-ping ml-2' style={{animationDelay: '0.4s'}}></div>
          </div>
          <p className='text-lg'>
            COMMUNICATION CHANNEL READY
          </p>
          <p className='text-sm opacity-70 mt-2'>
            Establish link to begin data transmission...
          </p>
        </div>
      )}
    </div>
  )
}

export { ConversationCard }
