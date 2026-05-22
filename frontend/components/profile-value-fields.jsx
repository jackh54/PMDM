"use client";

function fieldValue(values, field) {
  if (values[field.key] !== undefined) {
    return values[field.key];
  }
  if (field.default !== undefined) {
    return field.default;
  }
  return field.type === "boolean" ? false : "";
}

export default function ProfileValueFields({ schema, values, onChange }) {
  if (!schema?.fields?.length) {
    return null;
  }

  return (
    <div className="form-grid">
      {schema.fields.map((field) => {
        const value = fieldValue(values, field);
        if (field.type === "boolean") {
          return (
            <label key={field.key} className="checkbox-row">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange(field.key, e.target.checked)}
              />
              {field.label}
            </label>
          );
        }
        if (field.type === "text") {
          return (
            <div key={field.key}>
              <label>{field.label}</label>
              <textarea
                rows={4}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </div>
          );
        }
        return (
          <div key={field.key}>
            <label>{field.label}</label>
            <input
              type={field.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) =>
                onChange(
                  field.key,
                  field.type === "number" ? Number(e.target.value) : e.target.value
                )
              }
            />
          </div>
        );
      })}
    </div>
  );
}
