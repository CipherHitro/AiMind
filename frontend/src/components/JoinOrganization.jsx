import { useEffect, useState } from "react";
import { isAuthenticated } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Mail, Users, Shield, Loader2 } from "lucide-react";

function JoinOrganization() {
  const navigate = useNavigate();
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState(""); 
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("orgId");
    const userRole = params.get("role") || "member";
    const name = params.get('orgName') || "Organization";
    
    if (!id) {
      setError("Invalid invitation link");
      setTimeout(() => navigate("/chat"), 3000);
      return;
    }
    
    setOrgId(id);
    setRole(userRole);
    setOrgName(decodeURIComponent(name));
  }, [navigate]);

  const handleAccept = async () => {
    if (!orgId) return;

    if (!isAuthenticated()) {
      localStorage.setItem("pendingOrgJoin", orgId);
      navigate("/login", { state: { from: `/join-organization?orgId=${orgId}&role=${role}&orgName=${encodeURIComponent(orgName)}` } });
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_API_URL}/organization/${orgId}/joinOrganization`,
        {
          method: "POST",
          credentials: "include",
          headers : {
            "Content-Type" : "application/json"
          },
          body : JSON.stringify({role, orgName})
        }
      );

      const data = await response.json();
      if (response.ok) {
        navigate("/chat", { state: { message: `Successfully joined ${orgName}!` } });
      } else {
        setError(data.message || "Failed to join organization");
      }
    } catch (err) {
      console.error("Join error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    navigate("/chat", { state: { message: "Invitation declined" } });
  };

  if (error && !orgId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center px-4">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h2>
          <p className="text-gray-600">Redirecting you back...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-10 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Organization Invitation
            </h1>
            <p className="text-purple-100">
              You've been invited to collaborate
            </p>
          </div>

          {/* Content */}
          <div className="px-8 py-10">
            {/* Invitation Details */}
            <div className="text-center mb-8">
              <p className="text-gray-600 text-lg mb-4">
                You've been invited to join
              </p>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                {orgName}
              </h2>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mt-4">
                <Shield className="w-4 h-4 text-purple-600" />
                <span className="text-purple-700 font-medium capitalize">
                  {role} Role
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-l-4 border-purple-600 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    What happens when you accept?
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                      You'll become a {role} of {orgName}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                      Access shared resources and conversations
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                      Collaborate with team members
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAccept}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Accept Invitation</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDecline}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XCircle className="w-5 h-5" />
                <span>Decline</span>
              </button>
            </div>

            {/* Footer Note */}
            <p className="text-center text-sm text-gray-500 mt-6">
              By accepting, you agree to collaborate within this organization
            </p>
          </div>
        </div>

        {/* Bottom Info */}
        <div className="text-center mt-6">
          <p className="text-gray-600 text-sm">
            Not what you expected?{" "}
            <button
              onClick={() => navigate("/chat")}
              className="text-purple-600 hover:text-purple-700 font-medium underline"
            >
              Go back to chat
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default JoinOrganization;
