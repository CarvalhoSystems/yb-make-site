/**
 * @jest-environment jsdom
 */

/**
 * Regression tests for the Pix QR Code functionality introduced in commit 0bf656fb.
 *
 * Tests cover:
 *   - formatarCampoEmv: EMV TLV field encoding
 *   - calcularCrc16: CRC-16/CCITT-FALSE checksum
 *   - gerarPayloadPix: Full BR Code payload generation
 *   - copiarChavePix / tentarCopiaManual: Clipboard copy with fallback
 */

const fs = require("fs");
const path = require("path");
const vm = require("vm");

// ---------------------------------------------------------------------------
// Helper: load the pure Pix functions from src/main.js into an isolated
// sandbox so we test the *actual* source code, not a copy.
// ---------------------------------------------------------------------------
function loadPixFunctions() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "main.js"),
    "utf8",
  );

  const context = {
    document: {
      addEventListener: () => {},
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({
        value: "",
        select: () => {},
        setSelectionRange: () => {},
      }),
      body: {
        appendChild: () => {},
        removeChild: () => {},
      },
      execCommand: () => true,
    },
    window: { addEventListener: () => {}, isSecureContext: false },
    localStorage: { getItem: () => null, setItem: () => {} },
    firebase: {
      auth: () => ({ onAuthStateChanged: () => {} }),
      firestore: () => ({
        collection: () => ({ get: () => Promise.resolve({ docs: [] }) }),
      }),
    },
    Swal: { fire: () => ({}) },
    QRCode: function () {},
    navigator: { clipboard: null },
    console,
    setTimeout,
    clearTimeout,
    setInterval: () => {},
    clearInterval: () => {},
    alert: () => {},
    parseFloat,
    parseInt,
    String,
    Number,
    JSON,
    Array,
    Object,
    Math,
    Date,
    RegExp,
    Error,
    encodeURIComponent,
    decodeURIComponent,
    undefined,
    NaN,
    Infinity,
    isNaN,
    isFinite,
  };

  vm.createContext(context);
  vm.runInContext(source, context);

  return {
    formatarCampoEmv: context.formatarCampoEmv,
    calcularCrc16: context.calcularCrc16,
    gerarPayloadPix: context.gerarPayloadPix,
  };
}

const { formatarCampoEmv, calcularCrc16, gerarPayloadPix } =
  loadPixFunctions();

// =========================================================================
// formatarCampoEmv
// =========================================================================
describe("formatarCampoEmv", () => {
  test("formats a simple two-char value", () => {
    // id="00", valor="01" -> length 2 -> "000201"
    expect(formatarCampoEmv("00", "01")).toBe("000201");
  });

  test("formats the GUI identifier for Pix", () => {
    // "br.gov.bcb.pix" has length 14
    expect(formatarCampoEmv("00", "br.gov.bcb.pix")).toBe(
      "0014br.gov.bcb.pix",
    );
  });

  test("pads length to two digits for short values", () => {
    expect(formatarCampoEmv("52", "0000")).toBe("52040000");
  });

  test("handles longer values correctly", () => {
    const email = "yasmin_princesinha@icloud.com";
    const expected = `01${String(email.length).padStart(2, "0")}${email}`;
    expect(formatarCampoEmv("01", email)).toBe(expected);
  });

  test("handles single-character value", () => {
    expect(formatarCampoEmv("99", "A")).toBe("9901A");
  });

  test("handles empty string value", () => {
    expect(formatarCampoEmv("00", "")).toBe("0000");
  });
});

// =========================================================================
// calcularCrc16
// =========================================================================
describe("calcularCrc16", () => {
  test("returns a 4-character uppercase hex string", () => {
    const result = calcularCrc16("test");
    expect(result).toMatch(/^[0-9A-F]{4}$/);
  });

  test("produces correct CRC for a known payload (BR Code reference)", () => {
    // Manually verified CRC-16/CCITT-FALSE for the string "123456789"
    // The polynomial is 0x1021 with initial value 0xFFFF.
    // Known result for "123456789" is 0x29B1
    expect(calcularCrc16("123456789")).toBe("29B1");
  });

  test("produces correct CRC for an empty string", () => {
    // CRC-16/CCITT-FALSE of "" with init 0xFFFF is 0xFFFF
    expect(calcularCrc16("")).toBe("FFFF");
  });

  test("produces different CRCs for different inputs", () => {
    const crc1 = calcularCrc16("abc");
    const crc2 = calcularCrc16("abd");
    expect(crc1).not.toBe(crc2);
  });

  test("is deterministic", () => {
    const input = "some_pix_payload_data";
    expect(calcularCrc16(input)).toBe(calcularCrc16(input));
  });
});

// =========================================================================
// gerarPayloadPix
// =========================================================================
describe("gerarPayloadPix", () => {
  const defaultParams = {
    chave: "yasmin_princesinha@icloud.com",
    nome: "YASMIN B",
    cidade: "SAOPAULO",
    valor: "10.00",
  };

  test("starts with the payload format indicator 000201", () => {
    const payload = gerarPayloadPix(defaultParams);
    expect(payload.startsWith("000201")).toBe(true);
  });

  test("contains the Pix GUI identifier (br.gov.bcb.pix)", () => {
    const payload = gerarPayloadPix(defaultParams);
    expect(payload).toContain("br.gov.bcb.pix");
  });

  test("contains the Pix key", () => {
    const payload = gerarPayloadPix(defaultParams);
    expect(payload).toContain("yasmin_princesinha@icloud.com");
  });

  test("contains the merchant name", () => {
    const payload = gerarPayloadPix(defaultParams);
    expect(payload).toContain("YASMIN B");
  });

  test("contains the city", () => {
    const payload = gerarPayloadPix(defaultParams);
    expect(payload).toContain("SAOPAULO");
  });

  test("contains the transaction amount", () => {
    const payload = gerarPayloadPix(defaultParams);
    expect(payload).toContain("10.00");
  });

  test("contains the country code BR", () => {
    const payload = gerarPayloadPix(defaultParams);
    expect(payload).toContain("5802BR");
  });

  test("contains the currency code 986 (BRL)", () => {
    const payload = gerarPayloadPix(defaultParams);
    expect(payload).toContain("5303986");
  });

  test("ends with a 4-char CRC (6304 + hex)", () => {
    const payload = gerarPayloadPix(defaultParams);
    // The payload must end with "6304" followed by exactly 4 hex digits
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });

  test("CRC is valid for the payload content", () => {
    const payload = gerarPayloadPix(defaultParams);
    // Everything before the last 4 characters is the data used for CRC
    const payloadWithoutCrc = payload.slice(0, -4);
    const crcFromPayload = payload.slice(-4);
    expect(calcularCrc16(payloadWithoutCrc)).toBe(crcFromPayload);
  });

  test("uses default txid '***' when not provided", () => {
    const payload = gerarPayloadPix(defaultParams);
    expect(payload).toContain("0503***");
  });

  test("accepts a custom txid", () => {
    const payload = gerarPayloadPix({ ...defaultParams, txid: "ABC123" });
    expect(payload).toContain("ABC123");
    expect(payload).not.toContain("0503***");
  });

  test("truncates name to 25 characters", () => {
    const longName = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234"; // 30 chars
    const payload = gerarPayloadPix({ ...defaultParams, nome: longName });
    // Should contain only the first 25 chars
    expect(payload).toContain("ABCDEFGHIJKLMNOPQRSTUVWXY");
    expect(payload).not.toContain("Z1234");
  });

  test("truncates city to 15 characters", () => {
    const longCity = "RIODEJANEIROBRAZIL"; // 18 chars
    const payload = gerarPayloadPix({ ...defaultParams, cidade: longCity });
    expect(payload).toContain("RIODEJANEIROBRA");
    expect(payload).not.toContain("BRAZIL");
  });

  test("produces different payloads for different amounts", () => {
    const p1 = gerarPayloadPix({ ...defaultParams, valor: "10.00" });
    const p2 = gerarPayloadPix({ ...defaultParams, valor: "20.00" });
    expect(p1).not.toBe(p2);
  });

  test("produces deterministic output for the same input", () => {
    const p1 = gerarPayloadPix(defaultParams);
    const p2 = gerarPayloadPix(defaultParams);
    expect(p1).toBe(p2);
  });

  test("snapshot: full payload for the store's default Pix key with R$150.00", () => {
    const payload = gerarPayloadPix({
      chave: "yasmin_princesinha@icloud.com",
      nome: "YASMIN B",
      cidade: "SAOPAULO",
      valor: "150.00",
    });
    // Rebuild the expected payload manually to lock in the regression value
    const gui = "0014br.gov.bcb.pix";
    const chaveEmv = "0129yasmin_princesinha@icloud.com";
    const merchantAccount = `2651${gui}${chaveEmv}`;
    const parts = [
      "000201",
      merchantAccount,
      "52040000",
      "5303986",
      "5406150.00",
      "5802BR",
      "5908YASMIN B",
      "6008SAOPAULO",
      "62070503***",
      "6304",
    ].join("");
    const expectedCrc = calcularCrc16(parts);
    expect(payload).toBe(`${parts}${expectedCrc}`);
  });

  test("snapshot: full payload for the store's default Pix key with R$29.90", () => {
    const payload = gerarPayloadPix({
      chave: "yasmin_princesinha@icloud.com",
      nome: "YASMIN B",
      cidade: "SAOPAULO",
      valor: "29.90",
    });
    const gui = "0014br.gov.bcb.pix";
    const chaveEmv = "0129yasmin_princesinha@icloud.com";
    const merchantAccount = `2651${gui}${chaveEmv}`;
    const parts = [
      "000201",
      merchantAccount,
      "52040000",
      "5303986",
      "540529.90",
      "5802BR",
      "5908YASMIN B",
      "6008SAOPAULO",
      "62070503***",
      "6304",
    ].join("");
    const expectedCrc = calcularCrc16(parts);
    expect(payload).toBe(`${parts}${expectedCrc}`);
  });
});

// =========================================================================
// EMV TLV structure integrity
// =========================================================================
describe("Pix payload EMV structure", () => {
  test("all TLV fields have correct lengths", () => {
    const payload = gerarPayloadPix({
      chave: "yasmin_princesinha@icloud.com",
      nome: "YASMIN B",
      cidade: "SAOPAULO",
      valor: "50.00",
    });

    // Parse TLV fields from the payload (excluding the CRC value at the end)
    const fields = [];
    let pos = 0;
    while (pos < payload.length - 4) {
      // last 4 are CRC value
      const id = payload.substring(pos, pos + 2);
      const len = parseInt(payload.substring(pos + 2, pos + 4), 10);
      const value = payload.substring(pos + 4, pos + 4 + len);
      fields.push({ id, len, value });
      pos += 4 + len;
    }

    // Verify each field's declared length matches its actual value length
    for (const field of fields) {
      expect(field.value.length).toBe(field.len);
    }
  });

  test("merchant account info (ID 26) contains nested GUI (00) and key (01)", () => {
    const payload = gerarPayloadPix({
      chave: "test@example.com",
      nome: "TEST",
      cidade: "SP",
      valor: "1.00",
    });

    // Extract field 26
    let pos = 0;
    let field26Value = null;
    while (pos < payload.length - 4) {
      const id = payload.substring(pos, pos + 2);
      const len = parseInt(payload.substring(pos + 2, pos + 4), 10);
      const value = payload.substring(pos + 4, pos + 4 + len);
      if (id === "26") {
        field26Value = value;
        break;
      }
      pos += 4 + len;
    }

    expect(field26Value).not.toBeNull();

    // Parse nested TLV inside field 26
    const nested = [];
    let nPos = 0;
    while (nPos < field26Value.length) {
      const nId = field26Value.substring(nPos, nPos + 2);
      const nLen = parseInt(field26Value.substring(nPos + 2, nPos + 4), 10);
      const nVal = field26Value.substring(nPos + 4, nPos + 4 + nLen);
      nested.push({ id: nId, value: nVal });
      nPos += 4 + nLen;
    }

    // ID 00 = GUI, must be "br.gov.bcb.pix"
    const guiField = nested.find((f) => f.id === "00");
    expect(guiField).toBeDefined();
    expect(guiField.value).toBe("br.gov.bcb.pix");

    // ID 01 = Pix key
    const keyField = nested.find((f) => f.id === "01");
    expect(keyField).toBeDefined();
    expect(keyField.value).toBe("test@example.com");
  });
});

// =========================================================================
// copiarChavePix / tentarCopiaManual (DOM + clipboard interaction)
// =========================================================================
describe("copiarChavePix", () => {
  let mockChaveElement;
  let mockBtnElement;
  let originalGetElementById;

  beforeEach(() => {
    mockChaveElement = { innerText: "yasmin_princesinha@icloud.com" };
    mockBtnElement = {
      innerHTML: '<i class="fas fa-copy"></i> Copiar',
      style: { backgroundColor: "", color: "" },
    };

    originalGetElementById = document.getElementById;
    document.getElementById = jest.fn((id) => {
      if (id === "pix-chave") return mockChaveElement;
      if (id === "btn-copy-pix") return mockBtnElement;
      return null;
    });
  });

  beforeEach(() => {
    // jsdom does not define execCommand by default
    if (!document.execCommand) {
      document.execCommand = () => true;
    }
  });

  afterEach(() => {
    document.getElementById = originalGetElementById;
    jest.restoreAllMocks();
  });

  test("copies text via Clipboard API when available in secure context", async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      writable: true,
      configurable: true,
    });

    // Re-load functions with updated navigator/window
    const { copiarChavePix } = loadCopiarChavePixFromSource();
    copiarChavePix();

    await new Promise((r) => setTimeout(r, 50));
    expect(writeTextMock).toHaveBeenCalledWith(
      "yasmin_princesinha@icloud.com",
    );

    // Cleanup
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });
  });

  test("falls back to execCommand when Clipboard API is unavailable", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: null,
      writable: true,
      configurable: true,
    });

    const mockTextarea = {
      value: "",
      select: jest.fn(),
      setSelectionRange: jest.fn(),
    };
    const createElementSpy = jest
      .spyOn(document, "createElement")
      .mockReturnValue(mockTextarea);
    const appendChildSpy = jest
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => {});
    const removeChildSpy = jest
      .spyOn(document.body, "removeChild")
      .mockImplementation(() => {});
    const execCommandSpy = jest
      .spyOn(document, "execCommand")
      .mockReturnValue(true);

    const { tentarCopiaManual } = loadCopiarChavePixFromSource();
    const successCallback = jest.fn();
    tentarCopiaManual("yasmin_princesinha@icloud.com", successCallback);

    expect(createElementSpy).toHaveBeenCalledWith("textarea");
    expect(mockTextarea.value).toBe("yasmin_princesinha@icloud.com");
    expect(mockTextarea.select).toHaveBeenCalled();
    expect(mockTextarea.setSelectionRange).toHaveBeenCalledWith(0, 99999);
    expect(execCommandSpy).toHaveBeenCalledWith("copy");
    expect(successCallback).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  test("shows success visual feedback after copying", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: null,
      writable: true,
      configurable: true,
    });
    jest.spyOn(document, "createElement").mockReturnValue({
      value: "",
      select: jest.fn(),
      setSelectionRange: jest.fn(),
    });
    jest.spyOn(document.body, "appendChild").mockImplementation(() => {});
    jest.spyOn(document.body, "removeChild").mockImplementation(() => {});
    jest.spyOn(document, "execCommand").mockReturnValue(true);

    const { copiarChavePix } = loadCopiarChavePixFromSource();
    copiarChavePix();

    expect(mockBtnElement.innerHTML).toBe(
      '<i class="fas fa-check"></i> Copiado!',
    );
    expect(mockBtnElement.style.backgroundColor).toBe("#28a745");
    expect(mockBtnElement.style.color).toBe("#fff");
  });

  test("reverts button text after 2 seconds", () => {
    jest.useFakeTimers();

    Object.defineProperty(navigator, "clipboard", {
      value: null,
      writable: true,
      configurable: true,
    });
    jest.spyOn(document, "createElement").mockReturnValue({
      value: "",
      select: jest.fn(),
      setSelectionRange: jest.fn(),
    });
    jest.spyOn(document.body, "appendChild").mockImplementation(() => {});
    jest.spyOn(document.body, "removeChild").mockImplementation(() => {});
    jest.spyOn(document, "execCommand").mockReturnValue(true);

    const originalHTML = mockBtnElement.innerHTML;
    const { copiarChavePix } = loadCopiarChavePixFromSource();
    copiarChavePix();

    // After calling, button should show "Copiado!"
    expect(mockBtnElement.innerHTML).toBe(
      '<i class="fas fa-check"></i> Copiado!',
    );

    // After 2s, it should revert
    jest.advanceTimersByTime(2000);
    expect(mockBtnElement.innerHTML).toBe(originalHTML);
    expect(mockBtnElement.style.backgroundColor).toBe("");
    expect(mockBtnElement.style.color).toBe("");

    jest.useRealTimers();
  });

  test("shows alert when manual copy fails", () => {
    Object.defineProperty(navigator, "clipboard", {
      value: null,
      writable: true,
      configurable: true,
    });
    jest.spyOn(document, "createElement").mockReturnValue({
      value: "",
      select: jest.fn(),
      setSelectionRange: jest.fn(),
    });
    jest.spyOn(document.body, "appendChild").mockImplementation(() => {});
    jest.spyOn(document.body, "removeChild").mockImplementation(() => {});
    jest.spyOn(document, "execCommand").mockImplementation(() => {
      throw new Error("copy failed");
    });
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    const { tentarCopiaManual } = loadCopiarChavePixFromSource();
    const successCallback = jest.fn();
    tentarCopiaManual("test", successCallback);

    expect(successCallback).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Helper: load copiarChavePix and tentarCopiaManual from source.
// These functions reference the DOM directly, so we define them via Function
// constructor with the test's global scope (where we mock document, etc.).
// ---------------------------------------------------------------------------
function loadCopiarChavePixFromSource() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "main.js"),
    "utf8",
  );

  // Extract copiarChavePix function body
  const copiarMatch = source.match(
    /function copiarChavePix\(\)\s*\{([\s\S]*?)\n\}/,
  );
  // Extract tentarCopiaManual function body
  const manualMatch = source.match(
    /function tentarCopiaManual\(texto, callbackSucesso\)\s*\{([\s\S]*?)\n\}/,
  );

  if (!copiarMatch || !manualMatch) {
    throw new Error("Could not extract copy functions from src/main.js");
  }

  // Build tentarCopiaManual first (copiarChavePix depends on it)
  // eslint-disable-next-line no-new-func
  const tentarCopiaManual = new Function(
    "texto",
    "callbackSucesso",
    manualMatch[1],
  );

  // Build copiarChavePix with tentarCopiaManual in scope
  // eslint-disable-next-line no-new-func
  const copiarChavePixFn = new Function(
    "tentarCopiaManual",
    `return function copiarChavePix() {${copiarMatch[1]}\n}`,
  )(tentarCopiaManual);

  return {
    copiarChavePix: copiarChavePixFn,
    tentarCopiaManual,
  };
}
