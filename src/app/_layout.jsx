import { Stack } from "expo-router";
import {QueryClientProvider,QueryClient} from "@tanstack/react-query";

const queryClient = new QueryClient();
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "My Workout" }} />
      <Stack.Screen name="day/[dayId]" options={{ title: "Day Routine" }} />
      <Stack.Screen name="[name]" options={{ title: "Exercise Details" }} />
      <Stack.Screen name="aiCoach" options={{ title: "AI Coach" }} />
    </Stack>
  );
}
 