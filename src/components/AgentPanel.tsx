import {
    Box,
    IconButton,
    TextField,
    Tooltip,
    Typography,
  } from '@mui/material';
  import SendIcon from '@mui/icons-material/Send';
  import MicIcon from '@mui/icons-material/Mic';
  import AttachFileIcon from '@mui/icons-material/AttachFile';
  import { useRef, useEffect } from 'react';

  interface AgentPanelProps {
    context: 'inicio' | 'web' | 'prototipo' | 'flujo';
    showAttachments?: boolean;
    messages: { role: 'user' | 'agent'; content: string }[];
    onSendMessage: (text: string) => void;
    onFileUpload?: (files: FileList) => void;
  }
  
  export default function AgentPanel({ showAttachments, messages, onSendMessage, onFileUpload }: AgentPanelProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const handleSend = () => {
      const value = inputRef.current?.value.trim();
      if (value) {
        onSendMessage(value);
        if (inputRef.current) inputRef.current.value = '';
      }
    };
  
    const handleKeyPress = (e: React.KeyboardEvent) => {
      console.log(e)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // Solo si NO está presionando Shift
        handleSend();
      }
    };

    useEffect(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
      }
    }, [messages]);
  
    return (
      <Box sx={{ height:'100%', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        {messages.length == 0 ? (<Box></Box>) :
        (<Box sx={{ p: 3, borderRadius: 2, border: '1.5px solid #ccc', height:'100%', flex: '1 1 auto'}}>
  
          <Box
            ref={messagesEndRef}
            sx={{
              bgcolor: '#f9f9f9',
              borderRadius: 2,
              overflowY: 'auto',
              p: 2,
              mb: 2,
              boxSizing: 'border-box',
              //height: '300px'
              //height: '100%'
              flex: 1,
              minHeight: 0
            }}
          >
            {
              messages.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: msg.role === 'user' ? '#d1c4e9' : '#e8eaf6',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      maxWidth: '75%',
                    }}
                  >
                    <Typography variant="body2">{msg.content}</Typography>
                  </Box>
                </Box>
              ))
            }
          </Box>
        </Box>
        )}

        <Box sx={{ p: 3, mt: 2, borderRadius: 2, border: '1.5px solid #ccc' }}>
        <TextField
            fullWidth
            inputRef={inputRef}
            multiline
            minRows={1}
            maxRows={4}
            placeholder="Evaluxia está lista para ayudarte. Cuéntale qué necesitas"
            onKeyDown={handleKeyPress}
          />
          <Box sx={{display: 'flex', justifyContent: 'space-between', marginTop: 2}}>
            <Box>
              {showAttachments && (
                <Tooltip title="Adjuntar archivo">
                  <IconButton component="label">
                    <AttachFileIcon />
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        if (e.target.files && onFileUpload) onFileUpload(e.target.files);
                      }}
                    />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box sx={{display: 'flex', gap: 1}}>
              <Tooltip title="Dictar con voz">
                <IconButton>
                  <MicIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Enviar mensaje">
                <IconButton color="primary" onClick={handleSend} sx={{ bgcolor: '#ddd8ff' }}>
                  <SendIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
  