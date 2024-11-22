import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const verifyAddress = async (address: string): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an address verification expert. Given an address, verify and correct it to its proper format. Return only the corrected address without any additional text or explanation."
        },
        {
          role: "user",
          content: `Verify and correct this address: ${address}`
        }
      ],
      temperature: 0.3,
      max_tokens: 150
    });

    return response.choices[0].message.content || 'Unable to verify address';
  } catch (error) {
    console.error('Error verifying address:', error);
    throw new Error('Failed to verify address');
  }
};

export const verifyAddressBatch = async (addresses: string[]): Promise<string[]> => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an address verification expert. Given a list of addresses, verify and correct each one to its proper format. Return each corrected address on a new line without any additional text or explanation."
        },
        {
          role: "user",
          content: `Verify and correct these addresses:\n${addresses.join('\n')}`
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const verifiedAddresses = response.choices[0].message.content?.split('\n') || [];
    return verifiedAddresses;
  } catch (error) {
    console.error('Error verifying addresses:', error);
    throw new Error('Failed to verify addresses');
  }
};