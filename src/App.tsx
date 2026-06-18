import { useGameStore } from './store/gameStore';
import HomeScreen from './components/screens/HomeScreen';
import SetupScreen from './components/screens/SetupScreen';
import DraftScreen from './components/screens/DraftScreen';
import MatchScreen from './components/screens/MatchScreen';
import ResultScreen from './components/screens/ResultScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import DailyScreen from './components/screens/DailyScreen';
import ShopScreen from './components/screens/ShopScreen';

export default function App() {
  const screen = useGameStore(s => s.screen);

  return (
    <div className="min-h-screen bg-base text-text font-body">
      {screen === 'home'    && <HomeScreen />}
      {screen === 'setup'   && <SetupScreen />}
      {screen === 'draft'   && <DraftScreen />}
      {screen === 'match'   && <MatchScreen />}
      {screen === 'result'  && <ResultScreen />}
      {screen === 'profile' && <ProfileScreen />}
      {screen === 'daily'   && <DailyScreen />}
      {screen === 'shop'    && <ShopScreen />}
    </div>
  );
}
