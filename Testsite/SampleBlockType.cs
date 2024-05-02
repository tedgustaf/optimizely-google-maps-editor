using EPiServer.Core;
using EPiServer.DataAnnotations;
using GoogleMapsEditor;
using System.ComponentModel.DataAnnotations;

namespace Testsite
{
    [ContentType(GUID = "74126c0c-26c9-423a-b257-2438cdbbc3fc")]
    public class SampleBlockType : BlockData
    {
        public virtual GoogleMapsCoordinates? BlockCoordinates { get; set; }

        [UIHint(GoogleMapsEditorDescriptor.UIHint)]
        public virtual string? StringCoordinates { get; set; }
    }
}
