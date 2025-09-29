/* eslint-disable @typescript-eslint/no-explicit-any */
import NextAuth from 'next-auth/next';

export const authOptions = {
  providers: [
    {
      id: 'ivao',
      name: 'IVAO',
      type: 'oauth' as const,
      authorization: {
        url: 'https://login.ivao.aero/oauth/authorize',
        params: {
          scope: 'read:user',
          response_type: 'code',
        },
      },
      token: 'https://login.ivao.aero/oauth/token',
      userinfo: 'https://login.ivao.aero/api/user',
      clientId: process.env.IVAO_CLIENT_ID,
      clientSecret: process.env.IVAO_CLIENT_SECRET,
      profile(profile: any) {
        return {
          id: profile.id,
          name: `${profile.firstName} ${profile.lastName}`,
          email: profile.email || `${profile.id}@ivao.aero`,
          image: profile.avatar,
        };
      },
    },
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };