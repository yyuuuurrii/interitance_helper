import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

interface ModelInfoCardProps {
  conversationModel: string
  transcriptionModel: string
  voice: string
}

const ModelInfoCard = ({ conversationModel, transcriptionModel, voice }: ModelInfoCardProps) => {
  return (
    <Card className='mb-4'>
      <CardHeader>
        <CardTitle>Model Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-2 text-sm'>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>対話モデル:</span>
            <span className='font-mono'>{conversationModel}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>文字起こし:</span>
            <span className='font-mono'>{transcriptionModel}</span>
          </div>
          <div className='flex justify-between'>
            <span className='text-muted-foreground'>音声:</span>
            <span className='font-mono'>{voice}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { ModelInfoCard }