"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { requestSchema, sources } from "@/lib/validation";
type Field = {
  key: string;
  label: string;
  type?: string;
  options?: string[];
  required?: boolean;
};
const f = (
  key: string,
  label: string,
  type = "text",
  options?: string[],
  required = false,
): Field => ({ key, label, type, options, required });
const contact = [
  f("name", "Full name", "text", undefined, true),
  f("phone", "Phone number", "tel", undefined, true),
  f("email", "Email address", "email"),
  f("source", "How did you hear about us?", "select", [...sources]),
  f("referralCode", "Referral code (optional)"),
  f("referrerName", "Referrer name (optional)"),
];
const vehicle = [
  f("details.make", "Make", "text", undefined, true),
  f("details.model", "Model", "text", undefined, true),
  f("details.yearFrom", "Year from", "number", undefined, true),
  f("details.yearTo", "Year to", "number", undefined, true),
];
const specifications = [
  f("details.trim", "Trim"),
  f("details.color", "Preferred color"),
  f("details.maxMileage", "Maximum mileage (km)", "number"),
  f("details.condition", "Condition preference", "select", [
    "Any",
    "New",
    "Foreign used",
    "Locally used",
  ]),
];
const budgets = [
  f("details.budget", "Budget", "number", undefined, true),
  f(
    "details.currency",
    "Currency",
    "select",
    ["NGN", "USD", "GBP", "EUR"],
    true,
  ),
];
const sourcing = [
  f("details.title", "Title preference", "select", [
    "Clean title only",
    "Salvage acceptable",
    "Minor damage acceptable",
  ]),
  f("details.platform", "Sourcing platform", "select", [
    "Either",
    "Copart",
    "IAAI",
  ]),
];
const delivery = [
  f("details.delivery", "Delivery location", "text", undefined, true),
  f(
    "details.timeline",
    "Preferred timeline",
    "select",
    ["As soon as possible", "1–3 months", "3–6 months", "Flexible"],
    true,
  ),
];
const groups = [vehicle, specifications, budgets, sourcing, delivery, contact];
export function RequestForm({
  type,
  vehicle: initialVehicle = "",
  serviceLabel,
}: {
  type: string;
  vehicle?: string;
  serviceLabel?: string;
}) {
  const [step, setStep] = useState(0),
    [error, setError] = useState(""),
    [reference, setReference] = useState("");
  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { isSubmitting, errors },
    trigger,
  } = useForm<Record<string, any>>({
    defaultValues: {
      type,
      vehicle: initialVehicle,
      source: "WEBSITE",
      email: "",
      details: { currency: "NGN" },
    },
  });
  useEffect(() => {
    try {
      const source = sessionStorage.getItem("baw-source");
      if (source && sources.includes(source as (typeof sources)[number]))
        setValue("source", source);
      const query = new URLSearchParams(window.location.search);
      const ref = query.get("ref");
      if (ref) setValue("referralCode", ref);
    } catch {}
  }, [setValue]);
  let fields: Field[] = [...contact];
  if (type === "INSPECTION")
    fields = [
      f("vehicle", "Vehicle / stock number", "text", undefined, true),
      f(
        "details.inspectionType",
        "Inspection type",
        "select",
        [
          "Physical viewing",
          "Mechanic inspection",
          "Video inspection",
          "Remote inspection",
        ],
        true,
      ),
      f("details.date", "Preferred date", "date", undefined, true),
      f("details.time", "Preferred time", "time", undefined, true),
      ...contact,
    ];
  if (
    [
      "SHIPPING",
      "CLEARING",
      "FORWARDING",
      "IMPORTATION",
      "TRUCKING",
      "AUCTION_SOURCING",
    ].includes(type)
  ) {
    const map: Record<string, Field[]> = {
      SHIPPING: [
        f("details.originCountry", "Origin country", "text", undefined, true),
        f("details.origin", "Origin port / city", "text", undefined, true),
      ],
      CLEARING: [
        f(
          "details.service",
          "Service needed",
          "select",
          ["Clearing", "Forwarding", "Clearing & forwarding"],
          true,
        ),
        f("details.origin", "Arrival port", "text", undefined, true),
      ],
      FORWARDING: [f("details.origin", "Origin", "text", undefined, true)],
      TRUCKING: [
        f("details.pickup", "Pickup location", "text", undefined, true),
        f("details.date", "Preferred pickup date", "date", undefined, true),
      ],
      IMPORTATION: [],
      AUCTION_SOURCING: [
        f(
          "details.platform",
          "Auction platform",
          "select",
          ["Copart", "IAAI", "Either"],
          true,
        ),
        f("details.auctionUrl", "Auction URL", "url", undefined, true),
        f("details.lot", "Lot / stock number"),
        ...budgets,
      ],
    };
    fields = [
      ...map[type],
      ...(type === "AUCTION_SOURCING"
        ? []
        : [
            f("details.destination", "Destination", "text", undefined, true),
            f(
              "details.vehicleDescription",
              "Vehicle make, model and year",
              "text",
              undefined,
              ["SHIPPING", "TRUCKING", "IMPORTATION"].includes(type),
            ),
          ]),
      ...(["SHIPPING", "TRUCKING"].includes(type)
        ? [
            f(
              "details.running",
              "Vehicle condition",
              "select",
              ["Running", "Non-running"],
              true,
            ),
          ]
        : []),
      ...contact,
    ];
  }
  if (type === "PREORDER") fields = groups[step] || [];
  if (reference)
    return (
      <div className="notice" role="status">
        <CheckCircle2 />
        <h3>Request received.</h3>
        <p>
          Your reference is <strong>{reference}</strong>. Keep it handy when
          speaking with our team.
        </p>
        <p>
          We’ll review your requirements and follow up using the contact details
          you provided.
        </p>
      </div>
    );
  async function submit(values: Record<string, any>) {
    setError("");
    const parsed = requestSchema.safeParse({ ...values, type });
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => i.message).join(". "));
      return;
    }
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReference(data.reference);
      window.dispatchEvent(
        new CustomEvent("baw-track", {
          detail: {
            name:
              type === "PREORDER"
                ? "preorder_completed"
                : type === "VEHICLE_INQUIRY"
                  ? "vehicle_inquiry"
                  : type.toLowerCase() + "_request",
          },
        }),
      );
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Unable to send request. Please try again.",
      );
    }
  }
  return (
    <form className="form-card" onSubmit={handleSubmit(submit)}>
      {type === "PREORDER" && (
        <>
          <div className="steps" aria-label={`Step ${step + 1} of 7`}>
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className={i <= step ? "current" : ""} />
            ))}
          </div>
          <p className="step-label">STEP {step + 1} OF 7</p>
          <h3>
            {
              [
                "Your vehicle",
                "Make it yours",
                "Set your budget",
                "Sourcing preferences",
                "The destination",
                "Your details",
                "Review your request",
              ][step]
            }
          </h3>
        </>
      )}
      <div className="form-grid">
        {fields.map((field) => (
          <label className="field" key={field.key}>
            {field.label}
            {field.required ? " *" : ""}
            {field.options ? (
              <select
                {...register(field.key, {
                  required: field.required ? "This field is required" : false,
                })}
              >
                <option value="">Select an option</option>
                {field.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                type={field.type}
                min={
                  field.type === "date"
                    ? new Date().toISOString().slice(0, 10)
                    : field.type === "number"
                      ? "0"
                      : undefined
                }
                {...register(field.key, {
                  required: field.required ? "This field is required" : false,
                })}
              />
            )}
          </label>
        ))}
        {(type !== "PREORDER" || step === 5) && (
          <label className="field full">
            Additional notes
            <textarea maxLength={2000} {...register("details.notes")} />
          </label>
        )}
      </div>
      {type === "PREORDER" && step === 6 && (
        <dl className="specs">
          {Object.entries({
            ...getValues().details,
            name: getValues().name,
            phone: getValues().phone,
            email: getValues().email,
          })
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
        </dl>
      )}
      <div style={{ position: "absolute", left: -10000 }} aria-hidden="true">
        <input
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
          aria-label="Leave empty"
        />
      </div>
      {Object.keys(errors).length > 0 && (
        <p className="error" role="alert">
          Please complete the required fields.
        </p>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        {type === "PREORDER" && step > 0 && (
          <button
            type="button"
            className="button outline"
            onClick={() => {
              setStep(step - 1);
              setError("");
            }}
          >
            <ArrowLeft size={16} /> Back
          </button>
        )}
        {type === "PREORDER" && step < 6 ? (
          <button
            key="continue-step"
            className="button"
            type="button"
            onClick={async (event) => {
              event.preventDefault();
              if (await trigger(fields.map((f) => f.key))) {
                setStep(step + 1);
                if (step === 0)
                  window.dispatchEvent(
                    new CustomEvent("baw-track", {
                      detail: { name: "preorder_started" },
                    }),
                  );
              }
            }}
          >
            Continue <ArrowRight size={16} />
          </button>
        ) : (
          <button
            key="submit-request"
            type="submit"
            className="button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending…" : serviceLabel || "Send request"}{" "}
            <ArrowRight size={16} />
          </button>
        )}
      </div>
      <p style={{ fontSize: 11, marginTop: 20, marginBottom: 0 }}>
        We use your details to respond to this request. Submitting does not
        commit you to a purchase.
      </p>
    </form>
  );
}
