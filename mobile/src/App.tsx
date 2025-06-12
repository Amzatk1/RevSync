import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { StatusBar } from 'react-native';

import { store, persistor } from './store';
import { BottomTabNavigator } from './navigation/BottomTabNavigator';
import { Theme } from './styles/theme';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer>
          <StatusBar
            barStyle="light-content"
            backgroundColor={Theme.colors.primary}
          />
          <BottomTabNavigator />
        </NavigationContainer>
      </PersistGate>
    </Provider>
  );
};

export default App; 