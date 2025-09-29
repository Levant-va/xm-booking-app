declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      vid?: string;
      firstName?: string;
      lastName?: string;
      rating?: string;
      division?: string;
      country?: string;
      atcRating?: string;
      pilotRating?: string;
    };
  }

  interface JWT {
    accessToken?: string;
    vid?: string;
    firstName?: string;
    lastName?: string;
    rating?: string;
    division?: string;
    country?: string;
    atcRating?: string;
    pilotRating?: string;
  }
}
