import { getChatGPTUser } from './chatgpt-auth';
import Marketplace from './marketplace';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <Marketplace signedIn={Boolean(user)}/>;}
