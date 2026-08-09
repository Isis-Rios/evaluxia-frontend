// src/app/store.ts
import { configureStore } from '@reduxjs/toolkit'
import { combineReducers } from 'redux'
import storage from 'redux-persist/lib/storage'
import { persistReducer, persistStore } from 'redux-persist'

import authReducer from '@features/auth/authSlice'
import evaluatorProfilesReducer from '@features/evaluatorProfiles/evaluatorProfilesSlice'

const persistConfig = {
  key: 'evaluxia-root',
  storage,
  whitelist: ['auth'], // solo auth se persiste; evaluatorProfiles se hidrata al iniciar sesión
}

const rootReducer = combineReducers({
  auth: authReducer,
  evaluatorProfiles: evaluatorProfilesReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // requerido por redux-persist
    }),
})

export const persistor = persistStore(store)

// Tipos derivados — fuente única de verdad para TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
