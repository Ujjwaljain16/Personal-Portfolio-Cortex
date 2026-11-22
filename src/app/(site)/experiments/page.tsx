import { permanentRedirect } from "next/navigation";

// "Experiments" became "Investigations" when the records were rebuilt from the
// repositories. Keep old links working.
export default function ExperimentsRedirect() {
    permanentRedirect("/investigations");
}
