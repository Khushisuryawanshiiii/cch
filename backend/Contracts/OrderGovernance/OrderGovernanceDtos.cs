namespace backend.Contracts.OrderGovernance;

public record CreateDealRequest(
    string OpportunityNumber,
    string AccountName,
    string OpportunityName,
    decimal Amount,
    string Currency,
    string Stage,
    string OpportunityOwner,
    string AmName,
    string Geo,
    string DeliveryType,
    string CloseDate,
    string? Manager = null);

public record EnrichDealRequest(
    decimal ProductValue,
    decimal ServiceValue,
    decimal AmcValue,
    decimal OthersValue,
    decimal ProductCost,
    decimal ExternalServiceCost,
    decimal InternalCost,
    decimal OthersCost,
    string CustomerPaymentTerm,
    string VendorPaymentTerm,
    string? Stage = null);

public record ReviewerRouteRequest(
    string[] RequiredApprovals,
    string? ReviewerComments,
    string? Stage = null,
    decimal? ProductValue = null,
    decimal? ServiceValue = null,
    decimal? AmcValue = null,
    decimal? OthersValue = null,
    decimal? ProductCost = null,
    decimal? ExternalServiceCost = null,
    decimal? InternalCost = null,
    decimal? OthersCost = null,
    string? CustomerPaymentTerm = null,
    string? VendorPaymentTerm = null);

public record ApprovalDecisionRequest(string Decision, string? Comments);

public record ApprovalCommentRequest(string Comments);

public record CcConfirmRequest(decimal ActualPoValue, string SapOrder, string CustomerOrderNo);

public record IngestDealsRequest(decimal ThresholdInr, List<IngestDealRow> Rows);

// TEMP: Payload for the Dev-only reset-test-data endpoint. Caller must supply
// the exact string "RESET" as a typed-phrase confirmation. Remove along with
// the endpoint before any production release.
public record ResetTestDataRequest(string Confirmation);

public record IngestDealRow(
    string OpportunityNumber,
    string AccountName,
    string OpportunityName,
    decimal Amount,
    string Currency,
    string Stage,
    string OpportunityOwner,
    string AmName,
    string Geo,
    string DeliveryType,
    string CloseDate,
    string? Manager = null);
