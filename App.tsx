import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Shield, 
  Upload, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Search, 
  LogOut, 
  User as UserIcon, 
  FileVideo, 
  Activity,
  X,
  Menu,
  MoreVertical,
  Wifi
} from 'lucide-react';
import { Role, ProcessingStatus, SafetyStatus, User, Video, Notification } from './types';
import { auditVideoMetadata } from './services/geminiService';

// --- Constants & Mock Data ---

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Alice Admin', email: 'alice@corp.com', role: Role.ADMIN, organizationId: 'org1' },
  { id: 'u2', name: 'Bob Editor', email: 'bob@corp.com', role: Role.EDITOR, organizationId: 'org1' },
  { id: 'u3', name: 'Charlie Viewer', email: 'charlie@corp.com', role: Role.VIEWER, organizationId: 'org1' },
];

const INITIAL_VIDEOS: Video[] = [
  {
    id: 'v1',
    title: 'Q1 Financial Townhall',
    description: 'Quarterly updates from the executive team regarding Q1 performance.',
    uploadDate: '2023-10-25',
    duration: '45:12',
    size: '1.2 GB',
    uploaderId: 'u2',
    organizationId: 'org1',
    status: ProcessingStatus.COMPLETED,
    safetyStatus: SafetyStatus.SAFE,
    thumbnailUrl: 'https://picsum.photos/400/225?random=1',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    progress: 100,
    aiAnalysis: 'Content appears professional and related to business operations.'
  },
  {
    id: 'v2',
    title: 'Safety Training Module B',
    description: 'Required viewing for all warehouse staff handling hazardous materials.',
    uploadDate: '2023-10-26',
    duration: '12:30',
    size: '450 MB',
    uploaderId: 'u2',
    organizationId: 'org1',
    status: ProcessingStatus.COMPLETED,
    safetyStatus: SafetyStatus.SAFE,
    thumbnailUrl: 'https://picsum.photos/400/225?random=2',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    progress: 100
  },
  {
    id: 'v3',
    title: 'Incident Report - Loading Dock',
    description: 'Footage of the accident on 10/24 involving forklift #4.',
    uploadDate: '2023-10-27',
    duration: '02:15',
    size: '85 MB',
    uploaderId: 'u2',
    organizationId: 'org1',
    status: ProcessingStatus.COMPLETED,
    safetyStatus: SafetyStatus.FLAGGED,
    flagReason: 'Detected potential accident/violence',
    thumbnailUrl: 'https://picsum.photos/400/225?random=3',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    progress: 100,
    aiAnalysis: 'Visual analysis suggests rapid motion and collision consistent with workplace accidents.'
  }
];

// --- Components ---

const StatusBadge: React.FC<{ status: ProcessingStatus; safety: SafetyStatus }> = ({ status, safety }) => {
  if (status !== ProcessingStatus.COMPLETED) {
    let color = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    if (status === ProcessingStatus.FAILED) color = 'bg-red-500/10 text-red-400 border-red-500/20';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${color} flex items-center gap-1`}>
        {status === ProcessingStatus.PROCESSING || status === ProcessingStatus.ANALYZING ? (
          <Activity className="w-3 h-3 animate-spin" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
        {status}
      </span>
    );
  }

  if (safety === SafetyStatus.SAFE) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        SAFE
      </span>
    );
  } else if (safety === SafetyStatus.FLAGGED) {
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        FLAGGED
      </span>
    );
  }
  
  return (
    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 flex items-center gap-1">
      <Shield className="w-3 h-3" />
      REVIEW
    </span>
  );
};

const Header: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => (
  <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-900/20">
        <Shield className="w-6 h-6 text-white" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">SentinelStream</h1>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Enterprise Secure Video</p>
      </div>
    </div>
    <div className="flex items-center gap-6">
      <div className="hidden md:flex flex-col items-end">
        <span className="text-sm font-medium text-slate-200">{user.name}</span>
        <span className="text-xs text-brand-400 font-semibold">{user.role} @ {user.organizationId}</span>
      </div>
      <button 
        onClick={onLogout}
        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
        title="Logout"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  </header>
);

const VideoPlayer: React.FC<{ video: Video; onClose: () => void }> = ({ video, onClose }) => {
  const [bypassSafety, setBypassSafety] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 z-10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-brand-500" />
            {video.title}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Player Container */}
        <div className="aspect-video bg-black relative group w-full">
          {video.safetyStatus === SafetyStatus.FLAGGED && !bypassSafety ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-6 z-20">
               <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
               <h3 className="text-2xl font-bold text-white mb-2">Content Flagged</h3>
               <p className="text-slate-400 max-w-md">
                 This video has been flagged by our automated sensitivity analysis system. 
                 Reason: <span className="text-red-400">{video.flagReason || 'Policy Violation'}</span>
               </p>
               <div className="mt-6 flex gap-3">
                 <button 
                  onClick={() => alert("Review request submitted to Trust & Safety team.")}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium text-white transition-colors"
                 >
                   Request Review
                 </button>
                 <button 
                  onClick={() => setBypassSafety(true)}
                  className="px-4 py-2 border border-red-500/50 text-red-400 hover:bg-red-950/30 rounded-lg font-medium transition-colors"
                 >
                   Proceed Anyway (Admin)
                 </button>
               </div>
             </div>
          ) : (
            <video 
              src={video.videoUrl || "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"} 
              className="w-full h-full object-contain bg-black"
              controls
              autoPlay
              controlsList="nodownload"
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Metadata Panel */}
        <div className="p-6 bg-slate-900 overflow-y-auto">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-slate-300 leading-relaxed">{video.description}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={video.status} safety={video.safetyStatus} />
              <span className="text-xs text-slate-500">ID: {video.id}</span>
            </div>
          </div>
          
          {video.aiAnalysis && (
            <div className="mt-6 p-4 rounded-lg bg-slate-800/50 border border-slate-700">
              <h5 className="text-sm font-semibold text-brand-400 flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4" />
                AI Sensitivity Analysis
              </h5>
              <p className="text-sm text-slate-300 italic">"{video.aiAnalysis}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>(INITIAL_VIDEOS);
  const [uploading, setUploading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('alice@corp.com');

  // Simulated Socket/Polling Effect
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      setVideos(prevVideos => {
        let hasChanges = false;
        const nextVideos = prevVideos.map(v => {
          if (v.status === ProcessingStatus.UPLOADING) {
            hasChanges = true;
            const nextProgress = Math.min(v.progress + 10, 100);
            if (nextProgress === 100) {
              addNotification(`Upload complete: ${v.title}`, 'info');
              return { ...v, progress: 100, status: ProcessingStatus.PROCESSING };
            }
            return { ...v, progress: nextProgress };
          }
          if (v.status === ProcessingStatus.PROCESSING) {
            hasChanges = true;
            // Simulate random processing time
            if (Math.random() > 0.8) {
              return { ...v, status: ProcessingStatus.ANALYZING };
            }
            return v;
          }
          if (v.status === ProcessingStatus.ANALYZING) {
            hasChanges = true;
            if (Math.random() > 0.8) {
               // Simulate completion result
               const isUnsafe = v.description.toLowerCase().includes('accident') || v.description.toLowerCase().includes('attack');
               addNotification(`Processing finished: ${v.title}`, isUnsafe ? 'warning' : 'success');
               return { 
                 ...v, 
                 status: ProcessingStatus.COMPLETED, 
                 safetyStatus: isUnsafe ? SafetyStatus.FLAGGED : SafetyStatus.SAFE,
                 flagReason: isUnsafe ? 'Potential violent content detected' : undefined,
                 aiAnalysis: isUnsafe 
                    ? 'AI detected sudden movements and high-contrast frames typical of accidents.' 
                    : 'Content analyzed as standard corporate footage.'
               };
            }
            return v;
          }
          return v;
        });
        return hasChanges ? nextVideos : prevVideos;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const addNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type, timestamp: new Date() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = MOCK_USERS.find(u => u.email === loginEmail);
    if (user) setCurrentUser(user);
    else alert('User not found (Try alice@corp.com)');
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentUser || currentUser.role === Role.VIEWER) return;

    setUploading(true);
    const formData = new FormData(e.currentTarget);
    const file = (e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement).files?.[0];
    const title = formData.get('title') as string;
    const desc = formData.get('description') as string;

    if (!file) {
      setUploading(false);
      return;
    }

    // Call Gemini for initial metadata audit (Optional enhancement)
    // We do this async and don't block the UI
    auditVideoMetadata(title, desc).then(aiResult => {
      console.log("Preliminary AI Audit:", aiResult);
    });

    // Simulate creation
    const newVideo: Video = {
      id: Math.random().toString(36).substr(2, 9),
      title: title || file.name,
      description: desc,
      uploadDate: new Date().toISOString().split('T')[0],
      duration: '--:--',
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      uploaderId: currentUser.id,
      organizationId: currentUser.organizationId,
      status: ProcessingStatus.UPLOADING,
      safetyStatus: SafetyStatus.UNKNOWN,
      thumbnailUrl: 'https://picsum.photos/400/225?grayscale',
      videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', // Default for new uploads
      progress: 0
    };

    setVideos(prev => [newVideo, ...prev]);
    addNotification(`Started upload: ${newVideo.title}`, 'info');
    
    // Reset form
    (e.target as HTMLFormElement).reset();
    setUploading(false);
  };

  // Filter videos based on search query
  const filteredVideos = videos.filter(video => 
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="bg-brand-600 p-3 rounded-xl shadow-lg shadow-brand-900/50">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">SentinelStream</h2>
          <p className="text-center text-slate-400 mb-8">Secure Enterprise Video Intelligence</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Select Persona</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              >
                {MOCK_USERS.map(u => (
                  <option key={u.id} value={u.email}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            <button 
              type="submit"
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-2.5 rounded-lg transition-all transform hover:scale-[1.02] shadow-lg shadow-brand-900/50"
            >
              Access Portal
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-slate-700 text-center text-xs text-slate-500">
            Protected by End-to-End Encryption & AI Sensitivity Analysis
          </div>
        </div>
      </div>
    );
  }

  const canUpload = currentUser.role === Role.EDITOR || currentUser.role === Role.ADMIN;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-brand-500/30">
      <Header user={currentUser} onLogout={() => setCurrentUser(null)} />

      {/* Notifications Toast */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-lg shadow-lg border-l-4 min-w-[300px] animate-slide-in backdrop-blur-md bg-slate-800/90 text-sm ${
            n.type === 'success' ? 'border-emerald-500 text-emerald-100' :
            n.type === 'warning' ? 'border-yellow-500 text-yellow-100' :
            n.type === 'error' ? 'border-red-500 text-red-100' :
            'border-blue-500 text-blue-100'
          }`}>
            {n.message}
          </div>
        ))}
      </div>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar / Upload Section */}
        <div className="lg:col-span-4 space-y-6">
          {canUpload ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl relative overflow-hidden">
               {/* Background accent */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-500" />
                Secure Upload
              </h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 hover:bg-slate-700/50 transition-colors text-center cursor-pointer group relative">
                  <input 
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    accept="video/*"
                    required
                  />
                  <div className="flex flex-col items-center">
                    <div className="p-3 bg-slate-700 rounded-full group-hover:bg-slate-600 transition-colors mb-3">
                      <FileVideo className="w-6 h-6 text-brand-400" />
                    </div>
                    <p className="text-sm text-slate-300 font-medium">Click or drag video here</p>
                    <p className="text-xs text-slate-500 mt-1">MP4, MOV, WEBM up to 2GB</p>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</label>
                  <input 
                    name="title" 
                    type="text" 
                    placeholder="E.g., Q3 Security Briefing"
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</label>
                  <textarea 
                    name="description" 
                    placeholder="Provide context for sensitivity analysis..."
                    rows={3}
                    className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all resize-none"
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-all shadow-lg shadow-brand-900/20 flex justify-center items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : 'Upload to Secure Storage'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl text-center">
              <UserIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-white font-semibold">Viewer Access</h3>
              <p className="text-slate-400 text-sm mt-2">You have read-only permissions. Contact an administrator to upload content.</p>
            </div>
          )}

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-xl">
             <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">System Status</h3>
             <div className="space-y-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-300">Processing Node</span>
                 <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-300">AI Analysis Engine</span>
                 <span className="text-brand-400 font-mono">Gemini-Flash-2.5</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-slate-300">Storage Usage</span>
                 <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                   <div className="h-full bg-brand-500 w-[65%]"></div>
                 </div>
               </div>
             </div>
          </div>
        </div>

        {/* Video Library */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Organization Library</h2>
            <div className="flex gap-2">
               <div className="relative">
                 <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                  type="text" 
                  placeholder="Search videos..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-full pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-brand-500 outline-none w-48 md:w-64 transition-all"
                 />
               </div>
               <button className="p-2 bg-slate-800 border border-slate-700 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                 <Menu className="w-4 h-4" />
               </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVideos.map(video => (
              <div 
                key={video.id} 
                className="group bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-500 transition-all shadow-lg hover:shadow-2xl flex flex-col"
              >
                {/* Thumbnail Area */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer" onClick={() => setSelectedVideo(video)}>
                  {video.status === ProcessingStatus.COMPLETED ? (
                    <>
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50">
                           <Play className="w-5 h-5 fill-white text-white ml-1" />
                        </div>
                      </div>
                      <span className="absolute bottom-2 right-2 bg-black/70 px-2 py-0.5 rounded text-xs font-medium text-white font-mono">
                        {video.duration}
                      </span>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <div className="w-full max-w-[200px] bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                         <div className="h-full bg-brand-500 transition-all duration-300 ease-linear" style={{ width: `${video.progress}%` }}></div>
                      </div>
                      <p className="text-xs text-brand-400 font-mono animate-pulse">{video.status.replace('_', ' ')}... {video.progress}%</p>
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2">
                    <StatusBadge status={video.status} safety={video.safetyStatus} />
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-100 line-clamp-1 group-hover:text-brand-400 transition-colors" title={video.title}>
                      {video.title}
                    </h3>
                    <button className="text-slate-500 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-grow">
                    {video.description}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span>{video.uploadDate}</span>
                      <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                      <span>{video.size}</span>
                    </div>
                    {/* Simulated Analysis Tooltip */}
                    {video.safetyStatus !== SafetyStatus.UNKNOWN && (
                       <span className="text-slate-400 flex items-center gap-1" title="Analyzed by Gemini">
                         AI Analyzed
                       </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </div>
  );
}

export default App;