import { error } from '@sveltejs/kit';
import { produce, source } from 'sveltekit-sse';
import type { RequestHandler } from './$types';
import { Readable } from 'node:stream';

const validStreams: string[] = [];

async function fetchValidStreams(backendUrl: string, apiKey: string) {
  const response = await fetch(`${backendUrl}/api/v1/stream/event_types`, {
    headers: {
      'x-api-key': apiKey
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch valid stream types');
  }
  let data = await response.json()
  return data.message;
}

export const POST: RequestHandler = async ({ params, locals }) => {
  const {  stream } = params;
  const backendUrl = locals.backendUrl;
  const apiKey = locals.apiKey;


  if (!backendUrl || !apiKey) {
    throw error(500, 'Backend URL or API key not configured');
  }


  if (validStreams.length === 0) {
    try {
      validStreams.push(...await fetchValidStreams(backendUrl, apiKey));
    } catch (err) {
      console.error('Error fetching valid streams:', err);
      throw error(500, 'Failed to fetch valid stream types');
    }
  }

  if (!validStreams.includes(stream)) {
    throw error(400, 'Invalid stream type');
  }

  const streamUrl = `${backendUrl}/api/v1/stream/${stream}`;
  const textDecoder = new TextDecoder();

  return produce(
    async function start({ emit }) {
      var response = await fetch(`${streamUrl}`, {
        headers: {
          'x-api-key': apiKey
        }
      })

      if(!response.body) {
        return
      }
      const reader = response.body.getReader();

      while (true) {

        const { done, value } = await reader.read();
        if (done) break;
        const text = textDecoder.decode(value);
        const textArray = text.split("\n")
        textArray.forEach((message) => {
          try{
            const json = JSON.parse(message)
            emit('message', message)
          }
          catch{
          }
        })

      }
    }
  )
};