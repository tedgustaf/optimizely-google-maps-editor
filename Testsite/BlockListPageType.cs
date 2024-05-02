using EPiServer.Core;
using EPiServer.DataAnnotations;
using System.Collections.Generic;

namespace Testsite;

[ContentType(GUID = "6ac30e66-1ef6-4f96-a6b6-ad67764318ba")]
public class BlockListPageType : PageData
{
    public virtual IList<SampleBlockType>? SampleBlockList { get; set; }
}
