'use client'

import { ApiKeyCard, localStorageKey } from '@/components/api-key-card'
import { ConversationCard } from '@/components/conversation-card'
import { ModelInfoCard } from '@/components/model-info-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Instructions, selectableInstructions } from '@/lib/config'
import { RealtimeClient } from '@openai/realtime-api-beta'
import { ItemType } from '@openai/realtime-api-beta/dist/lib/client.js'
import { Select } from '@radix-ui/react-select'
import { Mic, MicOff } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { WavRecorder, WavStreamPlayer } from '../lib/wavtools/index.js'

export default function Home() {
  // OpenAIの音声入出力ライブラリを初期化
  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: 24000 })
  )
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: 24000 })
  )
  const clientRef = useRef<RealtimeClient>(new RealtimeClient({}))
  // localStorageはクライアントサイドレンダリング完了後に安全に参照しclientRefを初期化
  useEffect(() => {
    const apiKey = localStorage.getItem(localStorageKey) || ''
    clientRef.current = new RealtimeClient({
      apiKey: apiKey,
      dangerouslyAllowAPIKeyInBrowser: true,
    })
  }, [])

  const startTimeRef = useRef<string>(new Date().toISOString())

  const [items, setItems] = useState<ItemType[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // システムプロンプト関連の処理
  const [instructions, setInstructions] = useState<Instructions>()
  const onChangeInstructions = (value: string) => {
    const instructions = JSON.parse(value) as Instructions
    setInstructions(instructions)
    clientRef.current.updateSession({
      instructions: instructions.content,
    })
  }

  // ミュート関連の処理
  const [isMute, setIsMute] = useState(false)
  const onChangeMuteToggle = async () => {
    const newValue = !isMute
    setIsMute(newValue)
    const wavRecorder = wavRecorderRef.current
    await (newValue
      ? wavRecorder.pause()
      : wavRecorder.record((data) =>
          clientRef.current.appendInputAudio(data.mono)
        ))
  }

  // 手動録音制御
  const toggleRecording = useCallback(async () => {
    const wavRecorder = wavRecorderRef.current
    const client = clientRef.current
    
    if (!isRecording) {
      // 録音開始
      setIsRecording(true)
      await wavRecorder.record((data) => client.appendInputAudio(data.mono))
    } else {
      // 録音停止して音声送信
      setIsRecording(false)
      await wavRecorder.pause()
      // 音声を送信して応答を生成
      client.createResponse()
    }
  }, [isRecording])

  const connectConversation = useCallback(async () => {
    // 前回の会話ログが残っていたらクリア

    setItems([])
    const client = clientRef.current
    const wavRecorder = wavRecorderRef.current
    const wavStreamPlayer = wavStreamPlayerRef.current

    // Set state variables
    startTimeRef.current = new Date().toISOString()
    setIsConnected(true)
    setItems(client.conversation.getItems())

    // Connect to microphone
    await wavRecorder.begin()

    // Connect to audio output
    await wavStreamPlayer.connect()

    // Connect to realtime API
    await client.connect()

    // メッセージを入れておくと会話開始時に挨拶から始めてくれる
    client.sendUserMessageContent([
      {
        type: `input_text`,
        text: `もしもし`,
      },
    ])
    // 手動制御なので自動録音は開始しない
  }, [])

  const disconnectConversation = useCallback(async () => {
    setIsConnected(false)

    const client = clientRef.current
    client.disconnect()

    const wavRecorder = wavRecorderRef.current
    await wavRecorder.end()

    const wavStreamPlayer = wavStreamPlayerRef.current
    await wavStreamPlayer.interrupt()

    // ミュート設定も解除
    setIsMute(false)
    // 録音状態もリセット
    setIsRecording(false)
  }, [])

  // 会話ログのスクロールを最下部に移動
  useEffect(() => {
    const conversationEls = [].slice.call(
      document.body.querySelectorAll('[data-conversation-content]')
    )
    for (const el of conversationEls) {
      const conversationEl = el as HTMLDivElement
      conversationEl.scrollTop = conversationEl.scrollHeight
    }
  }, [items])

  /**
   * Core RealtimeClient and audio capture setup
   * Set all of our instructions, tools, events and more
   */
  useEffect(() => {
    // Get refs
    const wavStreamPlayer = wavStreamPlayerRef.current
    const client = clientRef.current

    client.updateSession({
      model: 'gpt-4o-realtime-preview',
      instructions: instructions?.content,
      // Voice Optionsを指定
      voice: 'coral',
      // VADを無効にして手動制御にする
      turn_detection: null,
      input_audio_transcription: { model: 'whisper-1' },
      temperature: 0.6,
    })

    // イベントログの取得
    client.on('realtime.event', (realtimeEvent: RealtimeEvent) => {
      console.log(`${realtimeEvent.time}: ${realtimeEvent.event.type}`)
    })
    client.on('error', (event: any) => console.error(event))

    // 会話中に発話がはさまれた場合の処理
    client.on('conversation.interrupted', async () => {
      const trackSampleOffset = await wavStreamPlayer.interrupt()
      if (trackSampleOffset?.trackId) {
        const { trackId, offset } = trackSampleOffset
        await client.cancelResponse(trackId, offset)
      }
    })
    // 会話が更新された場合の処理（これがコア実装）
    client.on('conversation.updated', async ({ item, delta }: any) => {
      const items = client.conversation.getItems()
      if (delta?.audio) {
        wavStreamPlayer.add16BitPCM(delta.audio, item.id)
      }
      if (item.status === 'completed' && item.formatted.audio?.length) {
        const wavFile = await WavRecorder.decode(
          item.formatted.audio,
          24000,
          24000
        )
        item.formatted.file = wavFile
      }

      // 会話の更新がある度にitemsをどんどん更新していく
      setItems(items)
    })

    setItems(client.conversation.getItems())

    return () => {
      // cleanup; resets to defaults
      client.reset()
    }
  }, [instructions?.content])

  return (
    <div className='min-h-screen grid-pattern'>
      {/* Data Stream Background Effect */}
      <div className='data-stream-effect'>
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className='data-stream-line'
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>
      
      <div className='cockpit-container container mx-auto p-6 mt-4'>
        <div className='flex items-center justify-center mb-6'>
          <h1 className='cockpit-title'>
            <span className='status-indicator status-online'></span>
            CAREPOST VOICE COMMAND CENTER
          </h1>
        </div>
        <div className='grid grid-cols-3 gap-6'>
        <div className='col-span-2'>
          <div className='cockpit-card conversation-display p-4'>
            <div className='flex items-center mb-4'>
              <span className={`status-indicator ${
                isConnected ? 'status-online' : 'status-offline'
              }`}></span>
              <h2 className='holographic-text text-lg font-bold'>
                COMMUNICATION CHANNEL
              </h2>
              {isRecording && (
                <span className='status-indicator status-recording ml-4'></span>
              )}
            </div>
            <ConversationCard items={items} />
          </div>
        </div>
        <div className='space-y-4'>
          <div className='cockpit-card'>
            <ApiKeyCard />
          </div>
          
          <div className='cockpit-card'>
            <ModelInfoCard 
              conversationModel="gpt-4o-realtime-preview"
              transcriptionModel="whisper-1"
              voice="coral"
            />
          </div>
          
          <div className='cockpit-card'>
            <Card className='bg-transparent border-none'>
              <CardHeader>
                <CardTitle className='holographic-text'>MISSION PARAMETERS</CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={onChangeInstructions}>
                  <SelectTrigger className='w-full neon-border bg-transparent text-cyan-400'>
                    <SelectValue placeholder='Select Mission Profile' />
                  </SelectTrigger>
                  <SelectContent className='bg-gray-900 border-cyan-400'>
                    {selectableInstructions.map((instruction) => {
                      return (
                        <SelectItem
                          key={instruction.id}
                          value={JSON.stringify(instruction)}
                          className='text-cyan-400 hover:bg-cyan-900'
                        >
                          {instruction.shortName}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <div className='mt-4 text-sm text-cyan-300 bg-black/50 p-3 rounded neon-border'>
                  {instructions ? instructions.content : 'AWAITING MISSION PARAMETERS...'}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className='control-panel'>
            <Card className='bg-transparent border-none relative z-10'>
              <CardHeader>
                <CardTitle className='holographic-text'>CONTROL MATRIX</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex flex-col items-center space-y-4'>
                  <button
                    onClick={
                      isConnected ? disconnectConversation : connectConversation
                    }
                    className={`cockpit-button w-full py-4 px-6 rounded-lg ${isConnected ? 'border-red-500 text-red-400' : ''}`}
                  >
                    <div className='flex items-center justify-center relative z-10'>
                      {isConnected ? (
                        <MicOff className='mr-2' />
                      ) : (
                        <Mic className='mr-2' />
                      )}
                      {isConnected ? 'TERMINATE LINK' : 'ESTABLISH LINK'}
                    </div>
                  </button>
                  
                  {isConnected && (
                    <button
                      onClick={toggleRecording}
                      className={`cockpit-button w-full py-4 px-6 rounded-lg ${isRecording ? 'border-yellow-500 text-yellow-400' : ''}`}
                    >
                      <div className='flex items-center justify-center relative z-10'>
                        <Mic className='mr-2' />
                        {isRecording ? 'TRANSMIT DATA' : 'RECORD VOICE'}
                      </div>
                    </button>
                  )}
                  
                  <div className='text-center text-sm'>
                    {isConnected ? (
                      <div className='flex items-center justify-center space-x-2'>
                        <Switch
                          id='mute'
                          checked={isMute}
                          onCheckedChange={onChangeMuteToggle}
                          className='data-[state=checked]:bg-cyan-500'
                        />
                        <Label htmlFor='mute' className='text-cyan-400'>AUDIO MUTE</Label>
                      </div>
                    ) : (
                      <div className='text-cyan-400 holographic-text'>
                        INITIALIZE COMMUNICATION PROTOCOL
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

interface RealtimeEvent {
  time: string
  source: 'client' | 'server'
  count?: number
  event: { [key: string]: any }
}
