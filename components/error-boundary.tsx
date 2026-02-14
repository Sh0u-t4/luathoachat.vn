'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isChunkError: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a chunk loading error
    const isChunkError =
      error.name === 'ChunkLoadError' ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('webpack_require');

    return {
      hasError: true,
      error,
      isChunkError,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Auto-reload for chunk errors
    if (this.state.isChunkError) {
      console.log('[ErrorBoundary] Chunk load error detected, reloading page in 2 seconds...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      isChunkError: false,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isChunkError) {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <RefreshCw className="w-8 h-8 text-amber-600 animate-spin" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900">Đang cập nhật...</h2>
                <p className="text-slate-600">
                  Hệ thống đang tải phiên bản mới. Trang web sẽ tự động tải lại trong giây lát.
                </p>
              </div>
              <div className="pt-4">
                <Button
                  onClick={this.handleReload}
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                  size="lg"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tải lại ngay
                </Button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Đã có lỗi xảy ra</h2>
              <p className="text-slate-600">
                Xin lỗi, chúng tôi gặp sự cố khi hiển thị trang này.
              </p>
              {this.state.error && (
                <details className="text-left mt-4">
                  <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-700">
                    Chi tiết lỗi
                  </summary>
                  <pre className="mt-2 p-4 bg-slate-100 rounded-lg text-xs text-slate-700 overflow-auto max-h-40">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                Thử lại
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                size="lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tải lại trang
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
