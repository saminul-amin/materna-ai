export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Privacy</h1>
      <p className="mt-4 text-lg text-slate-700">This MVP is a demonstration prototype. It is designed to run on synthetic or demo information and is not intended for real patient data.</p>

      <h2 className="mt-10 text-xl font-bold text-slate-900">What the prototype does</h2>
      <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-700">
        <li>Stores the information you enter (or the synthetic demo patient) in the application database so features such as trends and reminders work.</li>
        <li>Hashes passwords and protects application routes with a signed session cookie.</li>
        <li>Validates all inputs on the server and keeps API keys out of the browser.</li>
        <li>Stores uploaded documents server-side and serves them only to their owner.</li>
        <li>Family sharing never exposes health measurements unless you explicitly switch that on.</li>
      </ul>

      <h2 className="mt-10 text-xl font-bold text-slate-900">What it does not do</h2>
      <ul className="mt-3 list-disc pl-5 space-y-2 text-slate-700">
        <li>It does not use any real patient data. The demo patient is synthetic and clearly labelled.</li>
        <li>It does not sell or share information with third parties.</li>
        <li>It does not collect unnecessary sensitive information.</li>
        <li>It has not undergone the production-grade security review, data-protection assessment or regulatory review that a real healthcare platform would require.</li>
      </ul>

      <h2 className="mt-10 text-xl font-bold text-slate-900">Optional external services</h2>
      <p className="mt-3 text-slate-700">If an operator configures an external language-model API key, assistant questions and a summary of stored context are sent to that provider to generate an answer. Without a key, the assistant runs entirely locally as a rule-based prototype.</p>
    </div>
  );
}
