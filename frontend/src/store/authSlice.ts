import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

const initialToken = localStorage.getItem('eduai_token');
const initialUser = localStorage.getItem('eduai_user') 
  ? JSON.parse(localStorage.getItem('eduai_user')!) 
  : null;

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  loading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('eduai_token', action.payload.token);
      localStorage.setItem('eduai_user', JSON.stringify(action.payload.user));
    },
    loginFailure(state) {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('eduai_token');
      localStorage.removeItem('eduai_user');
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('eduai_token');
      localStorage.removeItem('eduai_user');
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;
