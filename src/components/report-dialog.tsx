import { useEffect, useRef, useState } from "react";
import { timetable } from "../lib/data.ts";
import { useLabels } from "../lib/locale.tsx";
import { REPORT_KINDS, REPORT_NOTE_LIMIT, type Report, type ReportKind } from "../lib/report.ts";

export interface ReportTarget {
  readonly tripId: string;
  readonly serviceDate: string;
  /** One line naming the bus, shown at the top of the form. */
  readonly summary: string;
}

type Status = "editing" | "sending" | "sent" | "failed";

const reportUrl = import.meta.env.VITE_REPORT_URL;

/** The form a rider fills in to say a trip is wrong. Open while `target` is set. */
export function ReportDialog({
  target,
  onClose,
}: {
  readonly target: ReportTarget | null;
  readonly onClose: () => void;
}) {
  const L = useLabels();
  const dialog = useRef<HTMLDialogElement>(null);
  const [kind, setKind] = useState<ReportKind>("did_not_come");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<Status>("editing");

  useEffect(() => {
    if (target) {
      setKind("did_not_come");
      setNote("");
      setStatus("editing");
      dialog.current?.showModal();
    } else {
      dialog.current?.close();
    }
  }, [target]);

  const send = async () => {
    if (!target || !reportUrl) {
      return;
    }
    const report: Report = {
      tripId: target.tripId,
      kind,
      note,
      feedVersion: timetable.feedVersion,
      serviceDate: target.serviceDate,
    };
    setStatus("sending");
    try {
      const response = await fetch(reportUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      setStatus(response.ok ? "sent" : "failed");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl p-5 backdrop:bg-black/40"
    >
      <h2 className="text-lg font-semibold">{L.reportTitle}</h2>
      <p className="mt-1 text-sm text-neutral-700">{target?.summary}</p>

      {status === "sent" ? (
        <p role="status" className="mt-4 text-neutral-800">
          {L.reportSent}
        </p>
      ) : (
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <fieldset className="space-y-2">
            {REPORT_KINDS.map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="kind"
                  checked={kind === option}
                  onChange={() => setKind(option)}
                />
                {L.reportKinds[option]}
              </label>
            ))}
          </fieldset>
          <label className="block text-sm font-medium text-neutral-700">
            {L.reportNote}
            <textarea
              value={note}
              maxLength={REPORT_NOTE_LIMIT}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-base font-normal"
            />
          </label>
          {reportUrl ? null : (
            <p role="status" className="text-sm text-amber-900">
              {L.reportNotConnected}
            </p>
          )}
          {status === "failed" ? (
            <p role="alert" className="text-sm text-red-800">
              {L.reportFailed}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!reportUrl || status === "sending"}
            className="w-full rounded-lg bg-teal-700 px-4 py-2.5 font-medium text-white disabled:bg-neutral-300"
          >
            {status === "sending" ? L.reportSending : L.reportSend}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onClose}
        className="mt-3 w-full rounded-lg border border-neutral-300 px-4 py-2.5 font-medium"
      >
        {L.close}
      </button>
    </dialog>
  );
}
