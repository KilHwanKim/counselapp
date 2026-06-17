export default function SmsToast() {
    return (
        <div id="smsToast" className="fixed bottom-6 left-1/2 z-[70] hidden -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg" />
    );
}

export function SmsPageHeader({ title, description }) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:p-5">
            <p className="text-xs font-semibold tracking-[0.16em] text-gray-400 uppercase">SMS</p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">{title}</h2>
            {description ? <p className="mt-2 text-sm text-gray-500">{description}</p> : null}
        </section>
    );
}
