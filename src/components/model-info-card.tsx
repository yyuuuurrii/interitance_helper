import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface ModelInfoCardProps {
  conversationModel: string
  transcriptionModel: string
  voice: string
}

const ModelInfoCard = ({ conversationModel, transcriptionModel, voice }: ModelInfoCardProps) => {
  return (
    <Card className='bg-transparent border-none'>
      <CardHeader>
        <CardTitle className='holographic-text'>SYSTEM SPECIFICATIONS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4 text-sm'>
          <div className='flex justify-between items-center bg-black/30 p-3 rounded neon-border'>
            <span className='text-cyan-400 uppercase tracking-wide'>DIALOG CORE:</span>
            <span className='font-mono text-green-400 bg-black/50 px-2 py-1 rounded text-xs'>{conversationModel}</span>
          </div>
          <div className='flex justify-between items-center bg-black/30 p-3 rounded neon-border'>
            <span className='text-cyan-400 uppercase tracking-wide'>TRANSCRIBER:</span>
            <span className='font-mono text-green-400 bg-black/50 px-2 py-1 rounded text-xs'>{transcriptionModel}</span>
          </div>
          <div className='flex justify-between items-center bg-black/30 p-3 rounded neon-border'>
            <span className='text-cyan-400 uppercase tracking-wide'>VOICE SYNTH:</span>
            <span className='font-mono text-green-400 bg-black/50 px-2 py-1 rounded text-xs'>{voice.toUpperCase()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ModelInfoCard }