/* import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@features/auth/authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
})

// Inferir tipos para TypeScript
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch */

import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@features/auth/authSlice'

import storage from 'redux-persist/lib/storage'
import { persistReducer, persistStore } from 'redux-persist'
import { combineReducers } from 'redux'

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // solo persistimos la parte de auth
}

const rootReducer = combineReducers({
  auth: authReducer,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // necesario para evitar warnings con redux-persist
    }),
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

