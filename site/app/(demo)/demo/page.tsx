import { buildDemoSeed } from '@site/demo/corpus';
import { DemoApp } from '@site/demo/demo-app';

// Static route: the corpus is read once at build time and handed to the client, which holds the editable copy.
export default function DemoPage() {
  return <DemoApp seed={buildDemoSeed()} />;
}
