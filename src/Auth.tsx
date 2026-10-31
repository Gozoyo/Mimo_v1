import { useState } from 'react';
import { supabase } from './supabase';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: '注册成功！请查收邮件完成验证（如不需要验证可直接登录）。' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.error_description || error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-neutral-900">
          {isLogin ? '欢迎回到 MicroMove' : '开启你的微运动之旅'}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
        <form className="space-y-6" onSubmit={handleAuth}>
          <div>
            <label className="block text-sm font-medium leading-6 text-neutral-900">邮箱</label>
            <div className="mt-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-xl border-0 py-3 px-4 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm sm:leading-6 outline-none transition-all"
                placeholder="hello@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium leading-6 text-neutral-900">密码</label>
            <div className="mt-2">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-xl border-0 py-3 px-4 text-neutral-900 shadow-sm ring-1 ring-inset ring-neutral-200 focus:ring-2 focus:ring-inset focus:ring-neutral-900 sm:text-sm sm:leading-6 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {message && (
            <div className={`text-sm ${message.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
              {message.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center items-center gap-2 rounded-xl bg-neutral-900 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900 disabled:opacity-50 transition-all"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLogin ? '登录' : '注册'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-500">
          {isLogin ? '还没有账号？' : '已经有账号了？'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold leading-6 text-neutral-900 hover:text-neutral-700"
          >
            {isLogin ? '免费注册' : '直接登录'}
          </button>
        </p>
      </div>
    </div>
  );
}
