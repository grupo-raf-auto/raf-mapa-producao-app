// Esta função deve ser usada apenas em Server Components
// Para Client Components, use getAuthTokenClient() ou useAuth() hook

export async function getAuthTokenServer() {
  const { auth } = await import('@clerk/nextjs/server');
  const { getToken } = await auth();
  return await getToken();
}

export async function getAuthHeadersServer() {
  const token = await getAuthTokenServer();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}
