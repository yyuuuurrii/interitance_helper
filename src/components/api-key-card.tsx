import { Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

const localStorageKey = 'tmp::OPENAI_API_KEY'

const ApiKeyCard = () => {
  const [apiKey, setApiKey] = useState('')
  const [savedApiKey, setSavedApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    const apiKey = localStorage.getItem(localStorageKey)
    if (apiKey) {
      setSavedApiKey(apiKey ?? '')
    }
  }, [])

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value)
  }

  const toggleShowApiKey = () => {
    setShowApiKey(!showApiKey)
  }

  const saveApiKey = () => {
    localStorage.setItem(localStorageKey, apiKey)
    setSavedApiKey(apiKey)
    setApiKey('')
    alert('API Key has been saved!')
    window.location.reload()
  }

  return (
    <Card className='bg-transparent border-none'>
      <CardHeader>
        <CardTitle className='holographic-text'>SECURITY CREDENTIALS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex items-center space-x-2 mb-4'>
          <div className='w-full break-words overflow-hidden bg-black/50 p-3 rounded neon-border text-cyan-300 font-mono text-sm'>
            {savedApiKey && savedApiKey.length > 0
              ? showApiKey
                ? savedApiKey
                : '████████████████████████████████████████████████'
              : 'AWAITING AUTHORIZATION KEY...'}
          </div>
          <button
            onClick={toggleShowApiKey}
            className='cockpit-button p-2 rounded flex-shrink-0'
          >
            {showApiKey ? (
              <EyeOff className='w-4 h-4' />
            ) : (
              <Eye className='w-4 h-4' />
            )}
          </button>
        </div>
        <input
          id='apiKey'
          value={apiKey}
          onChange={handleApiKeyChange}
          className='w-full px-4 py-3 bg-transparent border-2 border-cyan-400 rounded-lg focus:outline-none focus:border-cyan-300 text-cyan-300 placeholder-cyan-600 font-mono'
          placeholder='Enter OpenAI Access Token'
        />
        <button onClick={saveApiKey} className='cockpit-button w-full mt-4 py-3 rounded-lg'>
          <span className='relative z-10'>AUTHORIZE ACCESS</span>
        </button>
      </CardContent>
    </Card>
  )
}

export { ApiKeyCard, localStorageKey }
