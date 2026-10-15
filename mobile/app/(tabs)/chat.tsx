import { Redirect } from 'expo-router';

// O chat foi removido do Escala Swipe; links antigos voltam para a Home.
export default function ChatRemovedScreen() {
  return <Redirect href="/(tabs)" />;
}
