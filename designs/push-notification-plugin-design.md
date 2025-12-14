# Design: docusaurus-plugin-push-notifications

A Docusaurus plugin that enables push notifications to notify users of new blog posts.

## Executive Summary

**Is this possible?** Yes, but with important caveats. Web Push Notifications require:
1. A **backend service** to send push notifications (cannot be done client-side only)
2. User permission and browser support
3. HTTPS (required for Service Workers and Push API)
4. VAPID keys for authentication

This design proposes a complete solution with multiple backend integration options.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DOCUSAURUS SITE                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐ │
│  │  Plugin Core    │    │  Service Worker   │    │ Subscribe UI   │ │
│  │  (Build-time)   │    │  (Browser)        │    │ (React)        │ │
│  │                 │    │                   │    │                │ │
│  │ - Extract blog  │    │ - Receive push    │    │ - Permission   │ │
│  │   metadata      │    │ - Show notif      │    │   request      │ │
│  │ - Generate      │    │ - Handle click    │    │ - Subscribe    │ │
│  │   manifest      │    │                   │    │   button       │ │
│  └────────┬────────┘    └──────────────────┘    └───────┬────────┘ │
│           │                                              │          │
└───────────┼──────────────────────────────────────────────┼──────────┘
            │                                              │
            ▼                                              ▼
┌───────────────────────┐                    ┌────────────────────────┐
│   Blog Posts Manifest │                    │   Push Subscription    │
│   (Static JSON)       │                    │   Endpoint             │
│                       │                    │                        │
│   - post slugs        │                    │   - endpoint URL       │
│   - titles            │                    │   - auth keys          │
│   - dates             │                    │   - p256dh key         │
│   - permalinks        │                    │                        │
└───────────────────────┘                    └───────────┬────────────┘
                                                         │
                                                         ▼
                                             ┌────────────────────────┐
                                             │   BACKEND SERVICE      │
                                             │   (Required)           │
                                             │                        │
                                             │   Options:             │
                                             │   - Self-hosted API    │
                                             │   - Firebase Cloud     │
                                             │     Messaging          │
                                             │   - OneSignal          │
                                             │   - Pusher/Ably        │
                                             │   - Custom serverless  │
                                             └────────────────────────┘
```

---

## Component Design

### 1. Plugin Core (`src/plugin.ts`)

**Purpose:** Build-time processing and configuration

```typescript
interface PushNotificationOptions {
  // Enable/disable the plugin
  enabled?: boolean;

  // VAPID keys for Web Push
  vapidPublicKey: string;

  // Backend integration
  backend: {
    type: 'custom' | 'firebase' | 'onesignal';
    subscriptionEndpoint?: string;  // For custom backend
    firebaseConfig?: FirebaseConfig;
    oneSignalAppId?: string;
  };

  // UI customization
  ui?: {
    promptDelay?: number;           // Delay before showing prompt (ms)
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    showOnBlogPages?: boolean;      // Only show on blog pages
    customComponent?: string;        // Path to custom React component
  };

  // Notification defaults
  notification?: {
    icon?: string;                  // Icon URL
    badge?: string;                 // Badge URL
    tag?: string;                   // Notification tag
    requireInteraction?: boolean;
  };

  // Blog integration
  blog?: {
    pluginId?: string;              // If using multiple blog instances
    includeAuthors?: boolean;
    includeTags?: boolean;
  };
}
```

**Lifecycle Hooks Used:**

| Hook | Purpose |
|------|---------|
| `loadContent()` | Extract blog post metadata for manifest |
| `contentLoaded()` | Set global data, add subscription management route |
| `postBuild()` | Generate service worker, blog manifest JSON |
| `injectHtmlTags()` | Register service worker, inject VAPID key |
| `getClientModules()` | Provide client-side subscription logic |
| `getThemePath()` | Provide SubscribeButton component |

### 2. Service Worker (`src/sw/push-sw.js`)

**Purpose:** Handle push events and display notifications

```javascript
// Lifecycle events
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Push event - receives notification from server
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};

  const options = {
    body: data.body || 'New content available',
    icon: data.icon || '/img/logo.png',
    badge: data.badge || '/img/badge.png',
    tag: data.tag || 'blog-update',
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Read Now' },
      { action: 'dismiss', title: 'Later' },
    ],
    requireInteraction: data.requireInteraction ?? false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'New Blog Post', options)
  );
});

// Notification click - navigate to blog post
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
```

### 3. Client Module (`src/client/index.ts`)

**Purpose:** Handle subscription management, permission requests

```typescript
import ExecutionEnvironment from '@docusaurus/ExecutionEnvironment';

interface SubscriptionManager {
  isSupported(): boolean;
  getPermissionState(): Promise<PermissionState>;
  subscribe(): Promise<PushSubscription>;
  unsubscribe(): Promise<boolean>;
  getSubscription(): Promise<PushSubscription | null>;
}

// Check browser support
function isSupported(): boolean {
  return (
    ExecutionEnvironment.canUseDOM &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// Register service worker
async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register(
    '/push-sw.js',
    { scope: '/' }
  );
  return registration;
}

// Subscribe to push notifications
async function subscribeToPush(
  vapidPublicKey: string,
  subscriptionEndpoint: string
): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  // Send subscription to backend
  await fetch(subscriptionEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });

  return subscription;
}

// Export for use by UI components
export const pushNotifications: SubscriptionManager = {
  isSupported,
  getPermissionState,
  subscribe: () => subscribeToPush(VAPID_KEY, ENDPOINT),
  unsubscribe,
  getSubscription,
};
```

### 4. Theme Components

#### SubscribeButton (`src/theme/SubscribeButton/index.tsx`)

```tsx
interface SubscribeButtonProps {
  className?: string;
  position?: 'fixed' | 'inline';
}

function SubscribeButton({ className, position = 'fixed' }: SubscribeButtonProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'subscribed' | 'denied'>('idle');

  // Check initial state on mount
  useEffect(() => {
    checkSubscriptionState();
  }, []);

  const handleClick = async () => {
    setState('loading');
    try {
      await pushNotifications.subscribe();
      setState('subscribed');
    } catch (error) {
      if (Notification.permission === 'denied') {
        setState('denied');
      } else {
        setState('idle');
      }
    }
  };

  if (!pushNotifications.isSupported()) return null;
  if (state === 'subscribed') return <SubscribedBadge />;
  if (state === 'denied') return <DeniedMessage />;

  return (
    <button onClick={handleClick} className={className}>
      {state === 'loading' ? 'Subscribing...' : '🔔 Get notified of new posts'}
    </button>
  );
}
```

#### NotificationPrompt (`src/theme/NotificationPrompt/index.tsx`)

A dismissible prompt that appears after a delay:

```tsx
function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = usePersistentState('push-prompt-dismissed', false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), promptDelay);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || dismissed) return null;

  return (
    <div className={styles.prompt}>
      <p>Want to be notified when we publish new posts?</p>
      <SubscribeButton position="inline" />
      <button onClick={() => setDismissed(true)}>No thanks</button>
    </div>
  );
}
```

---

## Backend Integration Options

### Option A: Self-Hosted API

**Pros:** Full control, no vendor lock-in
**Cons:** Requires server infrastructure

```typescript
// Example: Express.js + web-push
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:admin@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Store subscriptions (database)
const subscriptions = new Map();

// Endpoint: Save subscription
app.post('/api/push/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.set(subscription.endpoint, subscription);
  res.status(201).json({ success: true });
});

// Endpoint: Send notification (called by CI/CD or admin)
app.post('/api/push/notify', async (req, res) => {
  const { title, body, url } = req.body;

  const payload = JSON.stringify({ title, body, url });

  const results = await Promise.allSettled(
    [...subscriptions.values()].map(sub =>
      webpush.sendNotification(sub, payload)
    )
  );

  res.json({ sent: results.filter(r => r.status === 'fulfilled').length });
});
```

### Option B: Firebase Cloud Messaging (FCM)

**Pros:** Free tier, scalable, well-documented
**Cons:** Google dependency

```typescript
// Plugin configuration
backend: {
  type: 'firebase',
  firebaseConfig: {
    apiKey: 'xxx',
    projectId: 'my-project',
    messagingSenderId: '123456789',
  }
}

// Client integration
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
```

### Option C: OneSignal

**Pros:** Easy setup, dashboard, segmentation
**Cons:** Branding on free tier

```typescript
backend: {
  type: 'onesignal',
  oneSignalAppId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
}
```

---

## Build-Time Blog Detection

### Approach 1: Hook into Docusaurus Blog Plugin

```typescript
async loadContent() {
  // Access blog plugin data through allContent
  // This requires coordination with @docusaurus/plugin-content-blog
}

async contentLoaded({ content, allContent, actions }) {
  // Extract blog posts from the blog plugin
  const blogPlugin = allContent['docusaurus-plugin-content-blog'];
  const blogPosts = blogPlugin?.default?.blogPosts || [];

  // Generate manifest
  const manifest = blogPosts.map(post => ({
    id: post.id,
    title: post.metadata.title,
    permalink: post.metadata.permalink,
    date: post.metadata.date,
    description: post.metadata.description,
  }));

  await actions.createData('blog-manifest.json', JSON.stringify(manifest));
}
```

### Approach 2: Scan Blog Directory Directly

```typescript
async loadContent() {
  const blogDir = path.join(context.siteDir, 'blog');
  const files = await glob('**/*.{md,mdx}', { cwd: blogDir });

  const posts = await Promise.all(files.map(async (file) => {
    const content = await fs.readFile(path.join(blogDir, file), 'utf-8');
    const { data: frontmatter } = matter(content);
    return {
      slug: file.replace(/\.mdx?$/, ''),
      ...frontmatter,
    };
  }));

  return { posts };
}
```

---

## Notification Trigger Strategies

Since Docusaurus is a static site generator, **we cannot automatically detect new posts at runtime**. Notifications must be triggered externally.

### Strategy 1: CI/CD Integration

```yaml
# .github/workflows/notify-new-post.yml
name: Notify New Blog Post

on:
  push:
    paths:
      - 'blog/**'

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Detect new posts
        id: detect
        run: |
          NEW_POSTS=$(git diff --name-only HEAD~1 HEAD -- blog/ | grep -E '\.(md|mdx)$')
          echo "posts=$NEW_POSTS" >> $GITHUB_OUTPUT

      - name: Send notifications
        if: steps.detect.outputs.posts != ''
        run: |
          curl -X POST ${{ secrets.PUSH_API_URL }}/notify \
            -H "Authorization: Bearer ${{ secrets.PUSH_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"posts": "${{ steps.detect.outputs.posts }}"}'
```

### Strategy 2: RSS Feed Polling

External service polls RSS feed and triggers notifications on new entries.

### Strategy 3: Manual Admin Trigger

Admin dashboard or CLI command to send notifications.

---

## File Structure

```
docusaurus-plugin-push-notifications/
├── src/
│   ├── index.ts                    # Main export
│   ├── plugin.ts                   # Plugin implementation
│   ├── types.ts                    # TypeScript interfaces
│   ├── options.ts                  # Option validation (Joi)
│   ├── client/
│   │   ├── index.ts                # Client module
│   │   ├── subscription.ts         # Push subscription logic
│   │   └── utils.ts                # VAPID key conversion, etc.
│   ├── sw/
│   │   └── push-sw.js              # Service worker template
│   └── theme/
│       ├── SubscribeButton/
│       │   ├── index.tsx
│       │   └── styles.module.css
│       └── NotificationPrompt/
│           ├── index.tsx
│           └── styles.module.css
├── package.json
├── tsconfig.json
├── README.md
└── CHANGELOG.md
```

---

## Configuration Example

```javascript
// docusaurus.config.js
module.exports = {
  plugins: [
    [
      'docusaurus-plugin-push-notifications',
      {
        vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
        backend: {
          type: 'custom',
          subscriptionEndpoint: 'https://api.mysite.com/push/subscribe',
        },
        ui: {
          promptDelay: 30000, // 30 seconds
          position: 'bottom-right',
          showOnBlogPages: true,
        },
        notification: {
          icon: '/img/notification-icon.png',
          badge: '/img/badge.png',
        },
      },
    ],
  ],
};
```

---

## Browser Compatibility

| Browser | Push API | Service Workers | Notes |
|---------|----------|-----------------|-------|
| Chrome 50+ | ✅ | ✅ | Full support |
| Firefox 44+ | ✅ | ✅ | Full support |
| Edge 17+ | ✅ | ✅ | Full support |
| Safari 16+ | ✅ | ✅ | Requires user gesture, macOS Ventura+ |
| iOS Safari 16.4+ | ⚠️ | ⚠️ | Web app must be added to home screen |

---

## Security Considerations

1. **VAPID Keys:** Never expose private key in client code
2. **HTTPS Required:** Push API only works on secure origins
3. **Subscription Validation:** Validate subscriptions on backend
4. **Rate Limiting:** Implement rate limits on notification sending
5. **Unsubscribe Handling:** Honor unsubscribe requests, clean up stale subscriptions
6. **CORS:** Properly configure CORS for subscription endpoint

---

## Limitations & Trade-offs

### What This Plugin CAN Do:
- ✅ Register service worker for push notifications
- ✅ Handle user subscription/unsubscription
- ✅ Display notifications when received
- ✅ Generate blog post manifests at build time
- ✅ Provide UI components for subscription management

### What This Plugin CANNOT Do:
- ❌ Send notifications without a backend server
- ❌ Automatically detect new posts at runtime (static site)
- ❌ Work on iOS Safari without PWA installation
- ❌ Guarantee delivery (push is best-effort)
- ❌ Work on HTTP (requires HTTPS)

---

## Alternative Approaches

If push notifications are too complex, consider these alternatives:

| Approach | Complexity | Pros | Cons |
|----------|------------|------|------|
| **Email Newsletter** | Low | Works everywhere, familiar | Requires email service |
| **RSS Feed** | Very Low | Standard, no backend | Users must use RSS reader |
| **Browser Notification (non-push)** | Medium | Simpler than push | Only works when site is open |
| **PWA + Badge API** | Medium | Shows unread count on icon | Limited browser support |

---

## Implementation Phases

### Phase 1: Core Infrastructure
- [ ] Service worker generation and registration
- [ ] Client-side subscription management
- [ ] Basic theme components (SubscribeButton)

### Phase 2: Backend Integrations
- [ ] Custom backend adapter
- [ ] Firebase Cloud Messaging adapter
- [ ] OneSignal adapter

### Phase 3: Enhanced Features
- [ ] Notification preferences (topics, frequency)
- [ ] Analytics integration
- [ ] A/B testing for prompts
- [ ] Segmentation support

### Phase 4: Developer Experience
- [ ] CLI tool for sending test notifications
- [ ] Admin dashboard component
- [ ] Comprehensive documentation

---

## Conclusion

A push notification plugin for Docusaurus is **feasible and useful**, but requires:

1. **A backend service** to send push notifications
2. **CI/CD integration** or manual trigger for new post detection
3. **HTTPS hosting** for the Docusaurus site
4. **User permission** which may not always be granted

The plugin can handle all client-side concerns (subscription, service worker, UI), but the notification sending must be handled externally. This is a fundamental limitation of web push notifications, not a Docusaurus-specific issue.

For sites that want a simpler solution, RSS feeds or email newsletters remain excellent alternatives.
