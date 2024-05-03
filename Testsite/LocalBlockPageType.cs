using EPiServer.Core;
using EPiServer.DataAnnotations;

namespace Testsite;

[ContentType(GUID = "d55e3e8a-cea1-4304-9d4b-4f39e54a312d")]
public class LocalBlockPageType : PageData
{
    public virtual SampleBlockType? SampleBlock { get; set; }
}
