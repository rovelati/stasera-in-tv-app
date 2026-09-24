import React, { useState } from 'react';
import { SafeAreaView, View, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { Header } from './src/components/Header';
import { BottomTabBar } from './src/components/BottomTabBar';
import { ProgramDetailModal } from './src/components/ProgramDetailModal';

// Screens
import { StaseraScreen } from './src/screens/StaseraScreen';
import { OraScreen } from './src/screens/OraScreen';
import { DomaniScreen } from './src/screens/DomaniScreen';
import { CanaliScreen } from './src/screens/CanaliScreen';
import { PreferitiScreen } from './src/screens/PreferitiScreen';
import { SearchScreen } from './src/screens/SearchScreen';

const MainNavigator: React.FC = () => {
  const { colors, isDarkMode, activeTab, searchQuery, setSearchQuery } = useApp();
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const handleSearchToggle = () => {
    if (isSearching) {
      setSearchQuery('');
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }
  };

  const renderActiveScreen = () => {
    if (isSearching || searchQuery.trim().length > 0) {
      return <SearchScreen />;
    }

    switch (activeTab) {
      case 'stasera':
        return <StaseraScreen />;
      case 'ora':
        return <OraScreen />;
      case 'domani':
        return <DomaniScreen />;
      case 'canali':
        return <CanaliScreen />;
      case 'preferiti':
        return <PreferitiScreen />;
      default:
        return <StaseraScreen />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      <Header
        isSearching={isSearching}
        onSearchToggle={handleSearchToggle}
      />
      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {renderActiveScreen()}
      </View>
      <BottomTabBar />
      <ProgramDetailModal />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
