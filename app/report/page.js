import { Suspense } from 'react';
import ReportPage from './ReportForm';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading report form...</div>}>
      <ReportPage />
    </Suspense>
  );
}
